"use server";

import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";

const SETTINGS_COLLECTION = "settings";
const MP_DOC_ID = "mercadopago";

export type MercadoPagoMode = "test" | "production";

export interface MercadoPagoModeCredentials {
  accessToken: string;
  webhookSecret: string;
}

export interface MercadoPagoSettings {
  activeMode: MercadoPagoMode;
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
  updatedAt: string;
  updatedBy?: string;
}

export interface MercadoPagoActive {
  mode: MercadoPagoMode;
  accessToken: string;
  webhookSecret: string;
}

interface MercadoPagoSettingsRaw {
  activeMode?: MercadoPagoMode;
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
  updatedAt?: Timestamp | ClientTimestamp;
  updatedBy?: string;
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

async function readRawSettings(): Promise<MercadoPagoSettingsRaw | null> {
  if (isAdminReady && adminDb) {
    const snap = await adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID).get();
    if (!snap.exists) return null;
    return snap.data() as MercadoPagoSettingsRaw;
  }
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, MP_DOC_ID));
  if (!snap.exists()) return null;
  return snap.data() as MercadoPagoSettingsRaw;
}

async function writeRawSettings(data: Record<string, unknown>): Promise<void> {
  if (isAdminReady && adminDb) {
    await adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID).set(data, { merge: true });
    return;
  }
  await setDoc(doc(db, SETTINGS_COLLECTION, MP_DOC_ID), data, { merge: true });
}

function nowTimestamp(): Timestamp | ClientTimestamp {
  return isAdminReady ? Timestamp.now() : ClientTimestamp.now();
}

function maskCredentials(creds: MercadoPagoModeCredentials | undefined): MercadoPagoModeCredentials | undefined {
  if (!creds) return undefined;
  return {
    accessToken: maskSecret(creds.accessToken),
    webhookSecret: maskSecret(creds.webhookSecret),
  };
}

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 6)}••••${value.slice(-4)}`;
}

function validatePrefix(mode: MercadoPagoMode, accessToken: string): string | null {
  // MercadoPago unificó el formato: tanto las credenciales de pruebas como las de
  // producción empiezan con APP_USR-. La diferencia está solo en qué sección del
  // panel las copiás. Aceptamos también TEST- (formato legacy) para el modo test.
  const validPrefixes =
    mode === "test" ? ["APP_USR-", "TEST-"] : ["APP_USR-"];
  const matches = validPrefixes.some((p) => accessToken.startsWith(p));
  if (!matches) {
    return mode === "test"
      ? "El Access Token de Pruebas debe empezar con APP_USR- o TEST-"
      : "El Access Token de Producción debe empezar con APP_USR-";
  }
  return null;
}

/**
 * Returns settings with credentials masked — safe to expose to the admin UI.
 */
export async function getMercadoPagoSettings(): Promise<MercadoPagoSettings | null> {
  try {
    const raw = await readRawSettings();
    if (!raw) return null;

    return {
      activeMode: raw.activeMode || "test",
      test: maskCredentials(raw.test),
      production: maskCredentials(raw.production),
      updatedAt: serializeTimestamp(raw.updatedAt),
      updatedBy: raw.updatedBy,
    };
  } catch (error) {
    console.error("Failed to get MercadoPago settings:", error);
    return null;
  }
}

/**
 * Returns the credentials of the active mode — used internally by the checkout
 * and webhook code. Not exposed via the admin UI.
 */
export async function getActiveMercadoPago(): Promise<MercadoPagoActive | null> {
  try {
    const raw = await readRawSettings();
    if (!raw) return null;
    const mode: MercadoPagoMode = raw.activeMode || "test";
    const creds = raw[mode];
    if (!creds || !creds.accessToken || !creds.webhookSecret) return null;
    return { mode, accessToken: creds.accessToken, webhookSecret: creds.webhookSecret };
  } catch (error) {
    console.error("Failed to get active MercadoPago credentials:", error);
    return null;
  }
}

/**
 * Returns both credential sets (raw, unmasked). Only call from server-side
 * webhook handler where we need to try both secrets for signature verification.
 */
export async function getMercadoPagoSecrets(): Promise<{
  activeMode: MercadoPagoMode;
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
} | null> {
  try {
    const raw = await readRawSettings();
    if (!raw) return null;
    return {
      activeMode: raw.activeMode || "test",
      test: raw.test,
      production: raw.production,
    };
  } catch (error) {
    console.error("Failed to get MercadoPago secrets:", error);
    return null;
  }
}

export async function saveMercadoPagoCredentials(input: {
  mode: MercadoPagoMode;
  accessToken: string;
  webhookSecret: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const accessToken = input.accessToken.trim();
  const webhookSecret = input.webhookSecret.trim();

  if (!accessToken || !webhookSecret) {
    return { success: false, error: "Access Token y Webhook Secret son obligatorios" };
  }

  const prefixError = validatePrefix(input.mode, accessToken);
  if (prefixError) return { success: false, error: prefixError };

  try {
    await writeRawSettings({
      [input.mode]: { accessToken, webhookSecret },
      updatedAt: nowTimestamp(),
      ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save MercadoPago credentials:", error);
    return { success: false, error: "No se pudo guardar las credenciales" };
  }
}

export async function setMercadoPagoActiveMode(input: {
  mode: MercadoPagoMode;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = await readRawSettings();
    const block = raw?.[input.mode];
    if (!block || !block.accessToken || !block.webhookSecret) {
      return {
        success: false,
        error: `Falta configurar las credenciales de ${input.mode === "test" ? "Pruebas" : "Producción"} antes de activar el modo`,
      };
    }

    await writeRawSettings({
      activeMode: input.mode,
      updatedAt: nowTimestamp(),
      ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to set MercadoPago active mode:", error);
    return { success: false, error: "No se pudo cambiar el modo activo" };
  }
}

export async function clearMercadoPagoMode(input: {
  mode: MercadoPagoMode;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (isAdminReady && adminDb) {
      const ref = adminDb.collection(SETTINGS_COLLECTION).doc(MP_DOC_ID);
      const FieldValue = (await import("firebase-admin/firestore")).FieldValue;
      await ref.update({
        [input.mode]: FieldValue.delete(),
        updatedAt: Timestamp.now(),
        ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
      });
    } else {
      const ref = doc(db, SETTINGS_COLLECTION, MP_DOC_ID);
      const { deleteField } = await import("firebase/firestore");
      await setDoc(
        ref,
        {
          [input.mode]: deleteField(),
          updatedAt: ClientTimestamp.now(),
          ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
        },
        { merge: true }
      );
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to clear MercadoPago mode:", error);
    return { success: false, error: "No se pudo limpiar las credenciales" };
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
