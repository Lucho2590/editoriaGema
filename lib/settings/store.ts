import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";

export const SETTINGS_COLLECTION = "settings";
export const MP_DOC_ID = "mercadopago";
export const TRANSFER_DOC_ID = "transfer";

export function serializeTimestamp(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
    const t = ts as { _seconds: number };
    return new Date(t._seconds * 1000).toISOString();
  }
  if (typeof ts === "object" && ts !== null && "toDate" in ts) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

export async function readSettingsDoc<T = Record<string, unknown>>(
  docId: string
): Promise<T | null> {
  if (isAdminReady && adminDb) {
    const snap = await adminDb.collection(SETTINGS_COLLECTION).doc(docId).get();
    if (!snap.exists) return null;
    return snap.data() as T;
  }
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, docId));
  if (!snap.exists()) return null;
  return snap.data() as T;
}

export async function writeSettingsDoc(
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  if (isAdminReady && adminDb) {
    await adminDb.collection(SETTINGS_COLLECTION).doc(docId).set(data, { merge: true });
    return;
  }
  await setDoc(doc(db, SETTINGS_COLLECTION, docId), data, { merge: true });
}

export function nowTimestamp(): Timestamp | ClientTimestamp {
  return isAdminReady ? Timestamp.now() : ClientTimestamp.now();
}
