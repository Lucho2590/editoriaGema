import Stripe from "stripe";
import { PaymentProvider, OrderItem, ShippingAddress } from "@/types";
import { createPreference, isPublicHttps } from "@/lib/mercadopago/client";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" })
  : null;

export interface CreatePaymentParams {
  provider: PaymentProvider;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  customerEmail: string;
  shippingAddress?: ShippingAddress;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
}

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  if (params.provider === "stripe") return createStripePayment(params);
  if (params.provider === "mercadopago") return createMercadoPagoPayment(params);
  return { success: false, error: "Invalid payment provider" };
}

async function createStripePayment(params: CreatePaymentParams): Promise<PaymentResult> {
  if (!stripe) return { success: false, error: "Stripe is not configured" };

  const { orderId, items, shippingCost, customerEmail, successUrl, failureUrl } = params;

  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: "ars",
        product_data: {
          name: `${item.bookTitle} (${item.format.toUpperCase()})`,
          description: `Por ${item.bookAuthor}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "ars",
          product_data: { name: "Envío" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: lineItems,
      metadata: { orderId },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&external_reference=${orderId}`,
      cancel_url: failureUrl,
    });

    return { success: true, checkoutUrl: session.url || undefined, paymentId: session.id };
  } catch (error) {
    console.error("Stripe payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

async function createMercadoPagoPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const {
    orderId,
    items,
    shippingCost,
    customerEmail,
    shippingAddress,
    successUrl,
    failureUrl,
    pendingUrl,
  } = params;

  const preferenceItems = items.map((item) => ({
    id: item.bookId,
    title: `${item.bookTitle} (${item.format.toUpperCase()})`,
    description: `Por ${item.bookAuthor}`,
    unit_price: item.price,
    quantity: item.quantity,
    currency_id: "ARS",
  }));

  if (shippingCost > 0) {
    preferenceItems.push({
      id: "shipping",
      title: "Envío",
      description: "Costo de envío",
      unit_price: shippingCost,
      quantity: 1,
      currency_id: "ARS",
    });
  }

  const [firstName, ...rest] = (shippingAddress?.fullName || "").trim().split(/\s+/);
  const lastName = rest.join(" ") || undefined;

  const baseUrl = new URL(successUrl).origin;
  const notificationUrl = `${baseUrl}/api/webhooks/payment/mercadopago`;
  const canAutoReturn = isPublicHttps(baseUrl);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const result = await createPreference({
    items: preferenceItems,
    payer: {
      email: customerEmail,
      ...(firstName ? { name: firstName } : {}),
      ...(lastName ? { surname: lastName } : {}),
      ...(shippingAddress?.phone
        ? { phone: { area_code: "", number: shippingAddress.phone } }
        : {}),
    },
    back_urls: {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
    },
    ...(canAutoReturn ? { auto_return: "approved" } : {}),
    external_reference: orderId,
    notification_url: notificationUrl,
    statement_descriptor: "GEMA EDITORIAL",
    binary_mode: false,
    expires: true,
    expiration_date_to: expiresAt.toISOString(),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  const initPoint =
    result.mode === "test"
      ? result.result.sandbox_init_point || result.result.init_point
      : result.result.init_point;

  return {
    success: true,
    checkoutUrl: initPoint || undefined,
    paymentId: result.result.id,
  };
}

export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event | null {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  try {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    return null;
  }
}
