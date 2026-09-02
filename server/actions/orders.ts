"use server";

import { adminDb, adminStorage, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  limit,
  Timestamp as ClientTimestamp
} from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { Order, OrderInput, OrderItem, PaymentStatus, DownloadLink } from "@/types";
import {
  sendPurchaseConfirmation,
  sendDownloadEmail,
  sendAdminNotification,
  sendTransferSubmittedNotification,
} from "./emails";
import { createPayment } from "@/lib/payments";
import { getTransferSettings } from "./settings";
import { getOrderById, updateOrderPayment } from "@/lib/orders/fulfillment";
import { assertAdmin } from "@/lib/auth/session";

const ORDERS_COLLECTION = "orders";
const USER_LIBRARY_COLLECTION = "user_library";

/**
 * Create a new order
 */
export async function createOrder(input: OrderInput): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const hasDigitalItems = input.items.some((item) => item.format === "pdf" || item.format === "epub");
    const hasPrintItems = input.items.some((item) => item.format === "print");
    const shippingCost = hasPrintItems ? calculateShipping(input.shippingAddress?.country) : 0;
    const discountAmount = input.discount?.amount ?? 0;

    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();

    const order: Record<string, unknown> = {
      userEmail: input.userEmail,
      items: input.items,
      subtotal,
      shippingCost,
      total: subtotal - discountAmount + shippingCost,
      paymentProvider: input.paymentProvider,
      paymentStatus: "pending" as PaymentStatus,
      orderStatus: "pending" as const,
      hasDigitalItems,
      hasPrintItems,
      emailSent: false,
      createdAt: now,
      updatedAt: now,
    };

    if (input.userId) {
      order.userId = input.userId;
    }
    if (input.shippingAddress) {
      order.shippingAddress = input.shippingAddress;
    }
    if (input.discount) {
      order.discount = input.discount;
    }

    if (!isAdminReady || !adminDb) {
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);
      return { success: true, orderId: docRef.id };
    }

    const docRef = await adminDb.collection(ORDERS_COLLECTION).add(order);
    return { success: true, orderId: docRef.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Calculate shipping cost based on country
 */
function calculateShipping(country?: string): number {
  if (!country) return 0;

  const shippingRates: Record<string, number> = {
    AR: 1500,
    CL: 3500,
    UY: 3000,
    BR: 4000,
    default: 8000,
  };

  return shippingRates[country] || shippingRates.default;
}

/**
 * Create order and initiate payment (server action wrapper)
 */
export async function createOrderAndPayment(
  input: OrderInput,
  paymentParams: { successUrl: string; failureUrl: string; pendingUrl: string }
): Promise<{ success: boolean; checkoutUrl?: string; orderId?: string; error?: string }> {
  try {
    const orderResult = await createOrder(input);
    if (!orderResult.success || !orderResult.orderId) {
      return { success: false, error: orderResult.error || "Failed to create order" };
    }

    const order = await getOrder(orderResult.orderId);
    if (!order) {
      return { success: false, error: "Order not found after creation" };
    }

    const paymentResult = await createPayment({
      provider: input.paymentProvider,
      orderId: orderResult.orderId,
      items: input.items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      customerEmail: input.userEmail,
      shippingAddress: input.shippingAddress,
      successUrl: paymentParams.successUrl,
      failureUrl: paymentParams.failureUrl,
      pendingUrl: paymentParams.pendingUrl,
    });

    if (!paymentResult.success || !paymentResult.checkoutUrl) {
      return { success: false, error: paymentResult.error || "Failed to create payment" };
    }

    if (paymentResult.paymentId) {
      try {
        if (isAdminReady && adminDb) {
          await adminDb.collection(ORDERS_COLLECTION).doc(orderResult.orderId).update({
            preferenceId: paymentResult.paymentId,
            updatedAt: Timestamp.now(),
          });
        } else {
          await updateDoc(doc(db, ORDERS_COLLECTION, orderResult.orderId), {
            preferenceId: paymentResult.paymentId,
            updatedAt: ClientTimestamp.now(),
          });
        }
      } catch (err) {
        console.error("Failed to store preferenceId on order:", err);
      }
    }

    return {
      success: true,
      checkoutUrl: paymentResult.checkoutUrl,
      orderId: orderResult.orderId,
    };
  } catch (error) {
    console.error("Failed to create order and payment:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

/**
 * Simulate a completed payment (development only)
 * Creates an order and immediately processes it as completed, triggering all emails.
 */
export async function simulatePayment(input: OrderInput): Promise<{ success: boolean; orderId?: string; error?: string }> {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Payment simulation is not available in production" };
  }

  try {
    const orderResult = await createOrder(input);
    if (!orderResult.success || !orderResult.orderId) {
      return { success: false, error: orderResult.error || "Failed to create order" };
    }

    const paymentResult = await updateOrderPayment(
      orderResult.orderId,
      `sim_${Date.now()}`,
      "completed"
    );

    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error || "Failed to process simulated payment" };
    }

    return { success: true, orderId: orderResult.orderId };
  } catch (error) {
    console.error("Failed to simulate payment:", error);
    return { success: false, error: "Failed to simulate payment" };
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  return getOrderById(orderId);
}

/**
 * Get orders for admin dashboard
 */
export async function getOrders(maxResults = 50): Promise<Order[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];

  try {
    if (!isAdminReady || !adminDb) {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
    }

    const snapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(maxResults)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
  } catch (error) {
    console.error("Failed to get orders:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Transferencia bancaria — manual checkout flow
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Crea una orden con paymentProvider = "transfer". El descuento se calcula
 * server-side a partir de los settings actuales (el cliente no lo decide).
 */
export async function createTransferOrder(
  input: Omit<OrderInput, "paymentProvider" | "discount">
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const settings = await getTransferSettings();
  if (!settings || !settings.enabled) {
    return { success: false, error: "Transferencia no está habilitada" };
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const percentage = settings.discountPercentage || 0;
  const amount = round2((subtotal * percentage) / 100);

  return createOrder({
    ...input,
    paymentProvider: "transfer",
    discount:
      amount > 0
        ? { type: "transfer", percentage, amount }
        : undefined,
  });
}

interface TransferDetailsInput {
  buyerName: string;
  buyerDni: string;
  buyerPhone: string;
  buyerBank: string;
  buyerAccount: string;
  receipt?: {
    base64: string;
    contentType: string;
    extension: string;
  };
}

export async function submitTransferDetails(
  orderId: string,
  details: TransferDetailsInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await getOrder(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };
    if (order.paymentProvider !== "transfer") {
      return { success: false, error: "La orden no es de transferencia" };
    }
    if (order.paymentStatus === "completed") {
      return { success: false, error: "La orden ya está pagada" };
    }

    let receiptUrl: string | undefined;
    let receiptStoragePath: string | undefined;

    if (details.receipt && isAdminReady && adminStorage) {
      const ext = (details.receipt.extension || "bin").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const path = `orders/${orderId}/comprobante.${ext || "bin"}`;
      const bucket = adminStorage.bucket();
      const file = bucket.file(path);
      const buffer = Buffer.from(details.receipt.base64, "base64");
      await file.save(buffer, {
        contentType: details.receipt.contentType || "application/octet-stream",
        resumable: false,
      });
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      receiptUrl = signedUrl;
      receiptStoragePath = path;
    }

    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();
    const transferDetails: Record<string, unknown> = {
      buyerName: details.buyerName.trim(),
      buyerDni: details.buyerDni.trim(),
      buyerPhone: details.buyerPhone.trim(),
      buyerBank: details.buyerBank.trim(),
      buyerAccount: details.buyerAccount.trim(),
      submittedAt: now,
    };
    if (receiptUrl) transferDetails.receiptUrl = receiptUrl;
    if (receiptStoragePath) transferDetails.receiptStoragePath = receiptStoragePath;

    const update: Record<string, unknown> = {
      transferDetails,
      paymentStatus: "processing" as PaymentStatus,
      updatedAt: now,
    };

    if (isAdminReady && adminDb) {
      await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update(update);
    } else {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), update);
    }

    try {
      const updated = await getOrder(orderId);
      if (updated) await sendTransferSubmittedNotification(updated);
    } catch (notifyErr) {
      console.error("Failed to notify admin about transfer submission:", notifyErr);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to submit transfer details:", error);
    return { success: false, error: "No se pudo enviar los datos" };
  }
}

export async function confirmTransferOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const order = await getOrder(orderId);
  if (!order) return { success: false, error: "Orden no encontrada" };
  if (order.paymentProvider !== "transfer") {
    return { success: false, error: "La orden no es de transferencia" };
  }

  const result = await updateOrderPayment(orderId, `transfer_${orderId}`, "completed");
  if (!result.success) return { success: false, error: result.error };
  return { success: true };
}

export async function rejectTransferOrder(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const order = await getOrder(orderId);
    if (!order) return { success: false, error: "Orden no encontrada" };
    if (order.paymentProvider !== "transfer") {
      return { success: false, error: "La orden no es de transferencia" };
    }

    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();
    const update = {
      paymentStatus: "failed" as PaymentStatus,
      transferRejectionReason: reason || "",
      updatedAt: now,
    };

    if (isAdminReady && adminDb) {
      await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update(update);
    } else {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), update);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to reject transfer order:", error);
    return { success: false, error: "No se pudo rechazar la orden" };
  }
}

