import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  isServerAuthConfigured,
  looksLikeLiveSessionCookie,
} from "@/lib/auth/config";

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

/**
 * First tier of the /admin guard: a cheap, dependency-free check that turns a
 * missing, malformed or expired session cookie into a real server-side
 * redirect, without a round trip to Firebase.
 *
 * The authoritative check — verifying the cookie's signature and the user's
 * isAdmin flag — lives in app/(admin)/layout.tsx. Doing it here too would mean
 * bundling firebase-admin into the proxy and paying a network call on every
 * request, including RSC prefetches.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Server Components can't read their own pathname, so hand it to the layout.
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname + search);
  const pass = NextResponse.next({ request: { headers } });

  // Without Admin SDK credentials there is no session to check. The layout
  // decides what that means (dev: allow, production: error screen).
  if (!isServerAuthConfigured()) return pass;

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (session && looksLikeLiveSessionCookie(session)) return pass;

  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = "";
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}
