import { cache } from "react";
import { cookies } from "next/headers";
import { adminAuth, adminDb, isAdminReady } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME, isServerAuthConfigured } from "@/lib/auth/config";

export interface SessionUser {
  uid: string;
  email: string | null;
  isAdmin: boolean;
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

    return { uid: decoded.uid, email: decoded.email ?? null, isAdmin };
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
    return { ok: true, user: { uid: "dev", email: null, isAdmin: true } };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sesión no válida. Iniciá sesión de nuevo." };
  if (!user.isAdmin) return { ok: false, error: "No tenés permisos de administrador" };
  return { ok: true, user };
}
