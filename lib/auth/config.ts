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
