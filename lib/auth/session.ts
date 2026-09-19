import { cache } from "react";
import { cookies } from "next/headers";
import { adminAuth, adminDb, isAdminReady } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME, isServerAuthConfigured } from "@/lib/auth/config";

export interface SessionUser {
  uid: string;
  email: string | null;
  isAdmin: boolean;
  /** Admin plus audit log and order deletion. Implies isAdmin. */
  isSuperAdmin: boolean;
}

/**
 * Superadmins are hardcoded on purpose: nothing a user can write to Firestore
 * can grant the role. Lowercase.
 */
const SUPERADMIN_EMAILS = ["lopezlucianomartin@gmail.com"];

function isSuperAdminEmail(email: string | null | undefined): boolean {
  return !!email && SUPERADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Authoritative server-side identity check. `cache` dedupes it within a single
 * request, so the layout, the page and any server action share one
 * verifySessionCookie round trip.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isAdminReady || !adminAuth) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;

  try {
    // checkRevoked: admin traffic is low volume, and it means a disabled or
    // demoted admin loses access immediately instead of up to 5 days later.
    const decoded = await adminAuth.verifySessionCookie(value, true);

    let isAdmin = decoded.admin === true;
    if (!isAdmin && adminDb) {
      const snap = await adminDb.collection("users").doc(decoded.uid).get();
      isAdmin = snap.exists && snap.data()?.isAdmin === true;
    }

    // Only trust the email once the provider has verified it
    const isSuperAdmin = decoded.email_verified === true && isSuperAdminEmail(decoded.email);

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      isAdmin: isAdmin || isSuperAdmin,
      isSuperAdmin,
    };
  } catch {
    // Expired, revoked or tampered — all the same to the caller.
    return null;
  }
});

export type AdminCheck =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

/**
 * Guard for server actions. Returns a result object rather than throwing, so
 * callers can surface their usual `{ success: false, error }` shape instead of
 * a generic Server Components render error.
 */
export async function assertAdmin(): Promise<AdminCheck> {
  if (!isServerAuthConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Autenticación del servidor no configurada" };
    }
    console.warn(
      "[auth] FIREBASE_ADMIN_* not set — admin guard bypassed (dev only)"
    );
    return { ok: true, user: DEV_USER };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida. Iniciá sesión de nuevo." };
  if (!user.isAdmin) return { ok: false, error: "No tenés permisos de administrador" };
  return { ok: true, user };
}

/**
 * Same as assertAdmin, for superadmin-only actions (audit log, order deletion).
 */
export async function assertSuperAdmin(): Promise<AdminCheck> {
  const auth = await assertAdmin();
  if (!auth.ok) return auth;
  if (!auth.user.isSuperAdmin) {
    return { ok: false, error: "Esta acción es solo para superadministradores" };
  }
  return auth;
}

const DEV_USER: SessionUser = { uid: "dev", email: null, isAdmin: true, isSuperAdmin: true };
