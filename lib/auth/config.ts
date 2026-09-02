/**
 * Shared auth constants and helpers.
 *
 * This module must stay dependency-free: it is imported by `proxy.ts`, whose
 * bundle would otherwise pull in `firebase-admin` (and gRPC with it).
 */

export const SESSION_COOKIE_NAME = "gema_session";

/** Firebase allows 5 minutes – 14 days for session cookies. */
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

export const SESSION_MAX_AGE_SECONDS = SESSION_EXPIRES_IN_MS / 1000;

/**
 * Mirrors the credential check in `lib/firebase-admin.ts`. Duplicated on
 * purpose so the proxy can read it without importing the Admin SDK.
 */
export function isServerAuthConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

/**
 * Guards against open redirects: only same-origin absolute paths pass through.
 */
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  // Protocol-relative URLs ("//evil.com", "/\evil.com") would leave the origin.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

/**
 * Cheap structural check on a session cookie: is it a JWT whose `exp` is still
 * in the future?
 *
 * This is NOT verification — it does not check the signature, and anyone can
 * craft a value that passes. Its only job is to let the proxy turn the obvious
 * cases (garbage, expired) into a clean server-side redirect. The authoritative
 * check is `verifySessionCookie` in lib/auth/session.ts.
 */
export function looksLikeLiveSessionCookie(value: string): boolean {
  const segments = value.split(".");
  if (segments.length !== 3) return false;

  try {
    const payload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const { exp } = JSON.parse(atob(padded));
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
