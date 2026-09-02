/**
 * Reads MercadoPago credentials straight from Firestore.
 *
 * Deliberately NOT a server action: these functions return unmasked secrets and
 * are only ever called server-to-server (checkout, webhook handler). Exposing
 * them as actions would make them POST-able endpoints by anyone.
 */
import { Timestamp } from "firebase-admin/firestore";
import { Timestamp as ClientTimestamp } from "firebase/firestore";
import { MP_DOC_ID, readSettingsDoc } from "@/lib/settings/store";

export type MercadoPagoMode = "test" | "production";

export interface MercadoPagoModeCredentials {
  accessToken: string;
  webhookSecret: string;
}

export interface MercadoPagoActive {
  mode: MercadoPagoMode;
  accessToken: string;
  webhookSecret: string;
}

export interface MercadoPagoSettingsRaw {
  activeMode?: MercadoPagoMode;
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
  updatedAt?: Timestamp | ClientTimestamp;
  updatedBy?: string;
}

export async function readRawSettings(): Promise<MercadoPagoSettingsRaw | null> {
  return readSettingsDoc<MercadoPagoSettingsRaw>(MP_DOC_ID);
}

/**
 * Credentials of the active mode — used by the checkout and webhook code.
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
 * Both credential sets, unmasked. The webhook handler needs them to try either
 * secret when verifying a signature.
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
