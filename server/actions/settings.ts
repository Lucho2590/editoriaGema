"use server";

import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";

const SETTINGS_COLLECTION = "settings";
const MP_DOC_ID = "mercadopago";

export interface MercadoPagoSettings {
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  userId: number;
  liveMode: boolean;
  expiresAt: string;
  connectedAt: string;
  connectedBy?: string;
}

interface MercadoPagoSettingsRaw {
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  userId: number;
  liveMode: boolean;
  expiresAt: Timestamp | ClientTimestamp;
  connectedAt: Timestamp | ClientTimestamp;
  connectedBy?: string;
}

function serializeTimestamp(ts: unknown): string {
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

export async function getMercadoPagoSettings(): Promise<MercadoPagoSettings | null> {
  try {
    let raw: MercadoPagoSettingsRaw | null = null;

    if (isAdminReady && adminDb) {
      const snap = await adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID).get();
      if (!snap.exists) return null;
      raw = snap.data() as MercadoPagoSettingsRaw;
    } else {
      const snap = await getDoc(doc(db, SETTINGS_COLLECTION, MP_DOC_ID));
      if (!snap.exists()) return null;
      raw = snap.data() as MercadoPagoSettingsRaw;
    }

    const settings: MercadoPagoSettings = {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      publicKey: raw.publicKey,
      userId: raw.userId,
      liveMode: raw.liveMode,
      expiresAt: serializeTimestamp(raw.expiresAt),
      connectedAt: serializeTimestamp(raw.connectedAt),
      connectedBy: raw.connectedBy,
    };

    const expiresAt = new Date(settings.expiresAt);
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (expiresAt.getTime() - now.getTime() < oneDayMs) {
      const refreshed = await refreshMercadoPagoToken(settings.refreshToken);
      if (refreshed) return refreshed;
    }

    return settings;
  } catch (error) {
    console.error("Failed to get MercadoPago settings:", error);
    return null;
  }
}

export async function saveMercadoPagoSettings(input: {
  accessToken: string;
  refreshToken: string;
  publicKey: string;
  userId: number;
  liveMode: boolean;
  expiresInSeconds: number;
  connectedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.expiresInSeconds * 1000);

    const data = {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      publicKey: input.publicKey,
      userId: input.userId,
      liveMode: input.liveMode,
      expiresAt: isAdminReady ? Timestamp.fromDate(expiresAt) : ClientTimestamp.fromDate(expiresAt),
      connectedAt: isAdminReady ? Timestamp.fromDate(now) : ClientTimestamp.fromDate(now),
      ...(input.connectedBy ? { connectedBy: input.connectedBy } : {}),
    };

    if (isAdminReady && adminDb) {
      await adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID).set(data);
    } else {
      await setDoc(doc(db, SETTINGS_COLLECTION, MP_DOC_ID), data);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to save MercadoPago settings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

export async function disconnectMercadoPago(): Promise<{ success: boolean; error?: string }> {
  try {
    if (isAdminReady && adminDb) {
      await adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID).delete();
    } else {
      await deleteDoc(doc(db, SETTINGS_COLLECTION, MP_DOC_ID));
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect MercadoPago:", error);
    return { success: false, error: "Failed to disconnect" };
  }
}

async function refreshMercadoPagoToken(refreshToken: string): Promise<MercadoPagoSettings | null> {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("MERCADOPAGO_CLIENT_ID or MERCADOPAGO_CLIENT_SECRET not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed to refresh MP token:", response.status, text);
      return null;
    }

    const data = await response.json();

    const result = await saveMercadoPagoSettings({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      publicKey: data.public_key,
      userId: data.user_id,
      liveMode: data.live_mode ?? true,
      expiresInSeconds: data.expires_in,
    });

    if (!result.success) return null;

    const now = new Date();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      publicKey: data.public_key,
      userId: data.user_id,
      liveMode: data.live_mode ?? true,
      expiresAt: new Date(now.getTime() + data.expires_in * 1000).toISOString(),
      connectedAt: now.toISOString(),
    };
  } catch (error) {
    console.error("Error refreshing MP token:", error);
    return null;
  }
}
