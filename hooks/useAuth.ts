"use client";

import { useState, useEffect } from "react";
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

interface AuthState {
  user: User | null;
  gemaUser: GemaUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    gemaUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get or create GEMA user profile
        const { gemaUser } = await getOrCreateGemaUser(firebaseUser);
        setState({
          user: firebaseUser,
          gemaUser,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          gemaUser: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { gemaUser } = await getOrCreateGemaUser(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { gemaUser } = await getOrCreateGemaUser(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
      });

      // Send welcome email (fire and forget)
      sendWelcomeEmail(result.user.email || email, result.user.displayName || undefined).catch(
        (err) => console.error("Failed to send welcome email:", err)
      );

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear cuenta";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  };

  const signInWithGoogle = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { gemaUser, isNew } = await getOrCreateGemaUser(result.user);
      setState({
        user: result.user,
        gemaUser,
        loading: false,
        error: null,
      });

      // Send welcome email only for new users (fire and forget)
      if (isNew) {
        sendWelcomeEmail(
          result.user.email || "",
          result.user.displayName || undefined
        ).catch((err) => console.error("Failed to send welcome email:", err));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error con Google";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setState({
        user: null,
        gemaUser: null,
        loading: false,
        error: null,
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
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    isAdmin: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(userRef, newUser);

  return { gemaUser: { id: firebaseUser.uid, ...newUser }, isNew: true };
}
