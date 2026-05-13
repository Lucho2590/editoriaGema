import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getActiveMercadoPago, type MercadoPagoActive } from "@/server/actions/settings";

export interface MercadoPagoClientContext {
  config: MercadoPagoConfig;
  mode: "test" | "production";
}

export async function getMercadoPagoContext(): Promise<MercadoPagoClientContext | null> {
  const active = await getActiveMercadoPago();
  if (!active) return null;
  return {
    config: new MercadoPagoConfig({ accessToken: active.accessToken }),
    mode: active.mode,
  };
}

export async function getPayment(paymentId: string): Promise<Awaited<ReturnType<Payment["get"]>> | null> {
  const ctx = await getMercadoPagoContext();
  if (!ctx) return null;
  try {
    const payment = new Payment(ctx.config);
    return await payment.get({ id: paymentId });
  } catch (error) {
    console.error("Failed to get MercadoPago payment:", error);
    return null;
  }
}

export async function searchPaymentsByExternalReference(externalReference: string) {
  const ctx = await getMercadoPagoContext();
  if (!ctx) return null;
  try {
    const payment = new Payment(ctx.config);
    return await payment.search({
      options: { external_reference: externalReference, sort: "date_created", criteria: "desc" },
    });
  } catch (error) {
    console.error("Failed to search MercadoPago payments:", error);
    return null;
  }
}

export type PreferenceCreateInput = Parameters<Preference["create"]>[0]["body"];

export async function createPreference(body: PreferenceCreateInput, ctx?: MercadoPagoClientContext) {
  const context = ctx || (await getMercadoPagoContext());
  if (!context) return { ok: false as const, error: "MercadoPago no está configurado" };
  try {
    const preference = new Preference(context.config);
    const result = await preference.create({ body });
    return { ok: true as const, mode: context.mode, result };
  } catch (error) {
    console.error("Failed to create MercadoPago preference:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to create preference",
    };
  }
}

export function isPublicHttps(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export type { MercadoPagoActive };
