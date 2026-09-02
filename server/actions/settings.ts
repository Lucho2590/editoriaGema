"use server";

import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, setDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { assertAdmin } from "@/lib/auth/session";
import {
  MP_DOC_ID,
  SETTINGS_COLLECTION,
  TRANSFER_DOC_ID,
  nowTimestamp,
  readSettingsDoc,
  serializeTimestamp,
  writeSettingsDoc,
} from "@/lib/settings/store";
import {
  readRawSettings,
  type MercadoPagoMode,
  type MercadoPagoModeCredentials,
} from "@/lib/settings/mercadopago";

export interface MercadoPagoSettings {
  activeMode: MercadoPagoMode;
  test?: MercadoPagoModeCredentials;
  production?: MercadoPagoModeCredentials;
  updatedAt: string;
  updatedBy?: string;
}

async function writeRawSettings(data: Record<string, unknown>): Promise<void> {
  return writeSettingsDoc(MP_DOC_ID, data);
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
  const auth = await assertAdmin();
  if (!auth.ok) return null;

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

export async function saveMercadoPagoCredentials(input: {
  mode: MercadoPagoMode;
  accessToken: string;
  webhookSecret: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

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
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

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
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

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
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

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

// ---------------------------------------------------------------------------
// Transferencia bancaria — settings & helpers
// ---------------------------------------------------------------------------

export interface TransferSettings {
  enabled: boolean;
  bankName: string;
  accountHolder: string;
  cuitCuil: string;
  cbu: string;
  alias: string;
  discountPercentage: number;
  contactEmail: string;
  instructions: string;
  updatedAt: string;
  updatedBy?: string;
}

interface TransferSettingsRaw {
  enabled?: boolean;
  bankName?: string;
  accountHolder?: string;
  cuitCuil?: string;
  cbu?: string;
  alias?: string;
  discountPercentage?: number;
  contactEmail?: string;
  instructions?: string;
  updatedAt?: Timestamp | ClientTimestamp;
  updatedBy?: string;
}

export async function getTransferSettings(): Promise<TransferSettings | null> {
  try {
    const raw = await readSettingsDoc<TransferSettingsRaw>(TRANSFER_DOC_ID);
    if (!raw) return null;
    return {
      enabled: raw.enabled ?? false,
      bankName: raw.bankName ?? "",
      accountHolder: raw.accountHolder ?? "",
      cuitCuil: raw.cuitCuil ?? "",
      cbu: raw.cbu ?? "",
      alias: raw.alias ?? "",
      discountPercentage: typeof raw.discountPercentage === "number" ? raw.discountPercentage : 0,
      contactEmail: raw.contactEmail ?? "",
      instructions: raw.instructions ?? "",
      updatedAt: serializeTimestamp(raw.updatedAt),
      updatedBy: raw.updatedBy,
    };
  } catch (error) {
    console.error("Failed to get transfer settings:", error);
    return null;
  }
}

export async function saveTransferSettings(input: {
  enabled: boolean;
  bankName: string;
  accountHolder: string;
  cuitCuil: string;
  cbu: string;
  alias: string;
  discountPercentage: number;
  contactEmail: string;
  instructions: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const bankName = input.bankName.trim();
  const accountHolder = input.accountHolder.trim();
  const cbu = input.cbu.trim();
  const alias = input.alias.trim();

  if (input.enabled) {
    if (!bankName || !accountHolder || (!cbu && !alias)) {
      return {
        success: false,
        error: "Para habilitar Transferencia se requieren banco, titular y al menos CBU o alias",
      };
    }
  }

  const discount = Number(input.discountPercentage);
  if (Number.isNaN(discount) || discount < 0 || discount > 100) {
    return { success: false, error: "El descuento debe ser un porcentaje entre 0 y 100" };
  }

  try {
    await writeSettingsDoc(TRANSFER_DOC_ID, {
      enabled: input.enabled,
      bankName,
      accountHolder,
      cuitCuil: input.cuitCuil.trim(),
      cbu,
      alias,
      discountPercentage: discount,
      contactEmail: input.contactEmail.trim(),
      instructions: input.instructions.trim(),
      updatedAt: nowTimestamp(),
      ...(input.updatedBy ? { updatedBy: input.updatedBy } : {}),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save transfer settings:", error);
    return { success: false, error: "No se pudo guardar la configuración" };
  }
}

export async function disableTransfer(updatedBy?: string): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    await writeSettingsDoc(TRANSFER_DOC_ID, {
      enabled: false,
      updatedAt: nowTimestamp(),
      ...(updatedBy ? { updatedBy } : {}),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to disable transfer:", error);
    return { success: false, error: "No se pudo deshabilitar" };
  }
}
