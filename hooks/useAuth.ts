"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as GemaUser } from "@/types";
import { sendWelcomeEmail } from "@/server/actions/emails";
import { syncSessionCookie, clearSessionCookie } from "@/lib/auth/session-client";

interface AuthState {
  user: User | null;
  gemaUser: GemaUser | null;
  loading: boolean;
  error: string | null;
  /** Whether the server-readable session cookie is in place for `user`. */
  sessionReady: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    gemaUser: null,
    loading: true,
    error: null,
    sessionReady: false,
  });
  const hadUser = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        hadUser.current = true;
        // Create the users/{uid} doc first so the session endpoint can read
        // isAdmin for a brand new Google sign-in.
        const { gemaUser } = await getOrCreateGemaUser(firebaseUser);
        if (cancelled) return;
        setState({
          user: firebaseUser,
          gemaUser,
          loading: false,
          error: null,
          sessionReady: false,
        });

        const ok = await syncSessionCookie(firebaseUser);
        if (cancelled) return;
        setState((prev) =>
          prev.user?.uid === firebaseUser.uid ? { ...prev, sessionReady: ok } : prev
        );
      } else {
        // Only fire the DELETE for an actual sign-out; otherwise every
        // anonymous visitor would hit the endpoint on each page load.
        if (hadUser.current) {
          hadUser.current = false;
          void clearSessionCookie();
        }
        if (cancelled) return;
        setState({
          user: null,
          gemaUser: null,
          loading: false,
          error: null,
          sessionReady: false,
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { gemaUser } = await getOrCreateGemaUser(result.user);
      // Awaited before returning: otherwise the caller navigates to /admin
      // before the cookie exists and the proxy bounces it back to login.
      const sessionReady = await syncSessionCookie(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
        sessionReady,
      });
      return { success: true, isAdmin: gemaUser.isAdmin, sessionReady };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message, isAdmin: false, sessionReady: false };
    }
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { gemaUser } = await getOrCreateGemaUser(result.user);
      const sessionReady = await syncSessionCookie(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
        sessionReady,
      });

      // Send welcome email (fire and forget)
      sendWelcomeEmail(result.user.email || email, result.user.displayName || undefined).catch(
        (err) => console.error("Failed to send welcome email:", err)
      );

      return { success: true, isAdmin: gemaUser.isAdmin, sessionReady };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear cuenta";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message, isAdmin: false, sessionReady: false };
    }
  };

  const signInWithGoogle = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { gemaUser, isNew } = await getOrCreateGemaUser(result.user);
      const sessionReady = await syncSessionCookie(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
        sessionReady,
      });

      // Send welcome email only for new users (fire and forget)
      if (isNew) {
        sendWelcomeEmail(
          result.user.email || "",
          result.user.displayName || undefined
        ).catch((err) => console.error("Failed to send welcome email:", err));
      }

      return { success: true, isAdmin: gemaUser.isAdmin, sessionReady };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error con Google";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message, isAdmin: false, sessionReady: false };
    }
  };

  const signOut = async () => {
    try {
      // Clear the cookie first so a fast navigation can't race a still-valid
      // one; the finally guarantees the Firebase sign-out happens regardless.
      try {
        await clearSessionCookie();
      } finally {
        hadUser.current = false;
        await firebaseSignOut(auth);
      }
      setState({
        user: null,
        gemaUser: null,
        loading: false,
        error: null,
        sessionReady: false,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cerrar sesión";
      return { success: false, error: message };
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAdmin: state.gemaUser?.isAdmin ?? false,
  };
}

async function getOrCreateGemaUser(firebaseUser: User): Promise<{ gemaUser: GemaUser; isNew: boolean }> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return { gemaUser: { id: userDoc.id, ...userDoc.data() } as GemaUser, isNew: false };
  }

  // Create new user profile
  const newUser: Omit<GemaUser, "id"> = {
    email: firebaseUser.email || "",
    isAdmin: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...(firebaseUser.displayName && { displayName: firebaseUser.displayName }),
    ...(firebaseUser.photoURL && { photoURL: firebaseUser.photoURL }),
  };

  await setDoc(userRef, newUser);

  return { gemaUser: { id: firebaseUser.uid, ...newUser }, isNew: true };
}
