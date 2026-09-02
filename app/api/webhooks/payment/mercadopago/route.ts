import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb, isAdminReady } from "@/lib/firebase-admin";
import { getPayment } from "@/lib/mercadopago/client";
import { getMercadoPagoSecrets } from "@/lib/settings/mercadopago";
import { updateOrderPayment } from "@/lib/orders/fulfillment";
import { mapMercadoPagoStatus } from "@/lib/mercadopago/status";
import { verifyWebhookSignature, parseSignatureHeader } from "@/lib/mercadopago/signature";

const ORDERS_COLLECTION = "orders";
const EVENTS_SUBCOLLECTION = "events";
const RACE_RETRY_DELAYS_MS = [100, 500, 2500];

interface WebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string | number };
  id?: string | number;
}

function getDataId(body: WebhookBody, url: URL): string | null {
  const fromBody = body.data?.id ?? body.id;
  if (fromBody) return String(fromBody);
  const fromQuery = url.searchParams.get("data.id") || url.searchParams.get("id");
  return fromQuery || null;
}

function getEventType(body: WebhookBody, url: URL): string {
  return body.type || url.searchParams.get("type") || "unknown";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOrderWithRetry(orderId: string) {
  if (!isAdminReady || !adminDb) return null;
  const ref = adminDb.collection(ORDERS_COLLECTION).doc(orderId);
  for (let i = 0; i <= RACE_RETRY_DELAYS_MS.length; i++) {
    const snap = await ref.get();
    if (snap.exists) return ref;
    if (i < RACE_RETRY_DELAYS_MS.length) {
      await sleep(RACE_RETRY_DELAYS_MS[i]);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id") || request.headers.get("X-Request-Id");

  let bodyJson: WebhookBody;
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
    bodyJson = rawBodyText ? (JSON.parse(rawBodyText) as WebhookBody) : {};
  } catch (error) {
    console.error("MP webhook: invalid JSON body", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dataId = getDataId(bodyJson, url);
  const eventType = getEventType(bodyJson, url);

  if (!dataId) {
    console.warn("MP webhook: missing data.id", { eventType, xRequestId });
    return NextResponse.json({ error: "Missing data.id" }, { status: 400 });
  }

  const secrets = await getMercadoPagoSecrets();
  if (!secrets) {
    console.error("MP webhook: no credentials configured");
    return NextResponse.json({ error: "MercadoPago not configured" }, { status: 503 });
  }

  const candidates: Array<{ mode: "test" | "production"; secret: string }> = [];
  const activeBlock = secrets[secrets.activeMode];
  if (activeBlock?.webhookSecret) {
    candidates.push({ mode: secrets.activeMode, secret: activeBlock.webhookSecret });
  }
  const otherMode = secrets.activeMode === "test" ? "production" : "test";
  const otherBlock = secrets[otherMode];
  if (otherBlock?.webhookSecret) {
    candidates.push({ mode: otherMode, secret: otherBlock.webhookSecret });
  }

  let verifiedMode: "test" | "production" | null = null;
  for (const candidate of candidates) {
    const ok = verifyWebhookSignature({
      xSignature,
      xRequestId,
      dataId,
      secret: candidate.secret,
    });
    if (ok) {
      verifiedMode = candidate.mode;
      break;
    }
  }

  if (!verifiedMode) {
    console.warn("MP webhook: signature mismatch", {
      dataId,
      xRequestId,
      hasSignatureHeader: Boolean(xSignature),
      parsedSignature: parseSignatureHeader(xSignature) ? "ok" : "bad",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (verifiedMode !== secrets.activeMode) {
    console.warn("MP webhook: arrived from inactive mode", {
      verifiedMode,
      activeMode: secrets.activeMode,
      dataId,
    });
  }

  if (eventType !== "payment") {
    return NextResponse.json({ received: true, ignored: eventType });
  }

  const payment = await getPayment(dataId);
  if (!payment) {
    console.error("MP webhook: payment not found in MP API", { dataId, xRequestId });
    return NextResponse.json({ received: true, warning: "payment_not_found" });
  }

  const orderId = (payment as { external_reference?: string | null }).external_reference;
  if (!orderId) {
    console.error("MP webhook: payment without external_reference", { dataId });
    return NextResponse.json({ received: true, warning: "missing_external_reference" });
  }

  const eventId = xRequestId || `${dataId}-${(payment as { status?: string }).status || "unknown"}`;

  if (!isAdminReady || !adminDb) {
    console.error("MP webhook: admin SDK not ready, cannot persist event");
    return NextResponse.json({ received: true, warning: "admin_not_ready" });
  }

  const orderRef = await fetchOrderWithRetry(orderId);
  if (!orderRef) {
    console.warn("MP webhook: order not found after retries", { orderId, dataId, xRequestId });
    return NextResponse.json({ received: true, warning: "order_not_found" });
  }

  const eventRef = orderRef.collection(EVENTS_SUBCOLLECTION).doc(eventId);
  try {
    await eventRef.create({
      receivedAt: Timestamp.now(),
      source: "mercadopago",
      eventType,
      dataId,
      verifiedMode,
      rawHeaders: {
        "x-signature": xSignature || "",
        "x-request-id": xRequestId || "",
      },
      rawBody: bodyJson,
      processed: false,
    });
  } catch (error) {
    const code = (error as { code?: string | number })?.code;
    if (code === 6 || code === "already-exists") {
      return NextResponse.json({ received: true, idempotent: true });
    }
    console.error("MP webhook: failed to create event doc", error);
    return NextResponse.json({ received: true, warning: "event_persist_failed" });
  }

  const mpStatus = (payment as { status?: string }).status;
  const paymentMethod = (payment as { payment_method_id?: string; payment_type_id?: string }).payment_method_id;
  const internalStatus = mapMercadoPagoStatus(mpStatus);

  try {
    const result = await updateOrderPayment(orderId, String((payment as { id?: number }).id ?? dataId), internalStatus, {
      providerStatus: mpStatus,
    });
    await eventRef.update({
      processed: true,
      processedStatus: internalStatus,
      skipped: result.skipped || false,
      paymentMethod: paymentMethod || null,
    });
  } catch (error) {
    console.error("MP webhook: failed to update order", { orderId, error });
    await eventRef.update({
      processingError: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ received: true, warning: "order_update_failed" });
  }

  return NextResponse.json({ received: true, status: internalStatus });
}
