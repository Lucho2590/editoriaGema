import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRES_IN_MS,
  SESSION_MAX_AGE_SECONDS,
  isServerAuthConfigured,
} from "@/lib/auth/config";

export const runtime = "nodejs";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Exchanges a Firebase ID token for an httpOnly session cookie the server can
 * read on every request (the client SDK keeps its state in IndexedDB only).
 */
export async function POST(request: NextRequest) {
  if (!isServerAuthConfigured() || !adminAuth) {
    // 503 rather than 401 so the client can tell a misconfigured server apart
    // from a bad token and skip the retry.
    return NextResponse.json(
      { error: "server-auth-not-configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (typeof idToken !== "string" || idToken.length === 0) {
      return NextResponse.json({ error: "missing-id-token" }, { status: 400 });
    }

    // createSessionCookie re-validates the token, so checkRevoked here would
    // only add a round trip. We need the uid for the profile lookup.
    const decoded = await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    let isAdmin = false;
    if (adminDb) {
      const snap = await adminDb.collection("users").doc(decoded.uid).get();
      isAdmin = snap.exists && snap.data()?.isAdmin === true;
    }

    const response = NextResponse.json({ uid: decoded.uid, isAdmin });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Failed to create session cookie:", error);
    // Generic message: Firebase error text leaks project internals.
    return NextResponse.json({ error: "invalid-token" }, { status: 401 });
  }
}

/**
 * Clears the session cookie. Always succeeds — signing out must never fail.
 *
 * Refresh tokens are deliberately not revoked: revocation is global to the
 * Firebase user, so it would kill their session on every other device and
 * break the client SDK's silent token refresh.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  // An explicit set with matching attributes is immune to path mismatches.
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
