import type { User } from "firebase/auth";

const SESSION_ENDPOINT = "/api/auth/session";

// Module-level so the dedupe holds across every `useAuth()` instance on the
// page — several components mount their own `onAuthStateChanged` listener.
let syncedUid: string | null = null;
let inflight: Promise<boolean> | null = null;

/**
 * Exchanges the user's ID token for a server-readable session cookie.
 * Returns whether the cookie is in place.
 */
export async function syncSessionCookie(user: User, force = false): Promise<boolean> {
  if (!force && syncedUid === user.uid) return true;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      // No forceRefresh: the SDK already returns a fresh token when the cached
      // one is close to expiring.
      let idToken = await user.getIdToken();
      let response = await postToken(idToken);

      // A stale cached token is the only case worth retrying. A 503 means the
      // server is misconfigured, so retrying would just loop.
      if (response.status === 401) {
        idToken = await user.getIdToken(true);
        response = await postToken(idToken);
      }

      syncedUid = response.ok ? user.uid : null;
      return response.ok;
    } catch (error) {
      console.error("Failed to sync session cookie:", error);
      syncedUid = null;
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function clearSessionCookie(): Promise<void> {
  syncedUid = null;
  try {
    await fetch(SESSION_ENDPOINT, {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch (error) {
    console.error("Failed to clear session cookie:", error);
  }
}

function postToken(idToken: string) {
  return fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ idToken }),
  });
}
