import Stripe from "stripe";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { PaymentProvider, OrderItem } from "@/types";
import { getMercadoPagoSettings } from "@/server/actions/settings";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" })
  : null;

async function getMercadoPagoClient(): Promise<MercadoPagoConfig | null> {
  const settings = await getMercadoPagoSettings();
  if (settings) {
    return new MercadoPagoConfig({ accessToken: settings.accessToken });
  }
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
  }
  return null;
}

export interface CreatePaymentParams {
  provider: PaymentProvider;
  orderId: string;
  items: OrderItem[];
  total: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Unified payment creation interface
 * Abstracts Stripe and MercadoPago behind a common API
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const { provider, orderId, items, total, customerEmail, successUrl, cancelUrl } = params;

  if (provider === "stripe") {
    return createStripePayment({
      orderId,
      items,
      total,
      customerEmail,
      successUrl,
      cancelUrl,
    });
  }

  if (provider === "mercadopago") {
    return createMercadoPagoPayment({
      orderId,
      items,
      total,
      customerEmail,
      successUrl,
      cancelUrl,
    });
  }

  return { success: false, error: "Invalid payment provider" };
}

async function createStripePayment(params: Omit<CreatePaymentParams, "provider">): Promise<PaymentResult> {
  if (!stripe) {
    return { success: false, error: "Stripe is not configured" };
  }

  const { orderId, items, customerEmail, successUrl, cancelUrl } = params;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      line_items: items.map((item) => ({
        price_data: {
          currency: "ars",
          product_data: {
            name: `${item.bookTitle} (${item.format.toUpperCase()})`,
            description: `Por ${item.bookAuthor}`,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId,
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      success: true,
      checkoutUrl: session.url || undefined,
      paymentId: session.id,
    };
  } catch (error) {
    console.error("Stripe payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

async function createMercadoPagoPayment(params: Omit<CreatePaymentParams, "provider">): Promise<PaymentResult> {
  const mercadopago = await getMercadoPagoClient();
  if (!mercadopago) {
    return { success: false, error: "MercadoPago is not configured" };
  }

  const { orderId, items, customerEmail, successUrl, cancelUrl } = params;

  try {
    const preference = new Preference(mercadopago);

    const preferenceData = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.bookId,
          title: `${item.bookTitle} (${item.format.toUpperCase()})`,
          description: `Por ${item.bookAuthor}`,
          unit_price: item.price,
          quantity: item.quantity,
          currency_id: "ARS",
        })),
        payer: {
          email: customerEmail,
        },
        back_urls: {
          success: successUrl,
          failure: cancelUrl,
          pending: cancelUrl,
        },
        auto_return: "approved",
        external_reference: orderId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment/mercadopago`,
      },
    });

    return {
      success: true,
      checkoutUrl: preferenceData.init_point || undefined,
      paymentId: preferenceData.id,
    };
  } catch (error) {
    console.error("MercadoPago payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment creation failed",
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(payload: string, signature: string): Stripe.Event | null {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook verification failed:", error);
    return null;
  }
}

/**
 * Get MercadoPago payment details
 */
export async function getMercadoPagoPayment(paymentId: string) {
  const mercadopago = await getMercadoPagoClient();
  if (!mercadopago) {
    return null;
  }

  try {
    const payment = new Payment(mercadopago);
    return await payment.get({ id: paymentId });
  } catch (error) {
    console.error("Failed to get MercadoPago payment:", error);
    return null;
  }
}
