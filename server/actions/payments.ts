"use server";

import { searchPaymentsByExternalReference } from "@/lib/mercadopago/client";
import { mapMercadoPagoStatus } from "@/lib/mercadopago/status";
import { getOrder, updateOrderPayment } from "./orders";
import type { PaymentStatus } from "@/types";

/**
 * Polling fallback for the success/pending pages: queries MP for the latest
 * payment matching this order's external_reference and syncs the order status
 * if it differs. Safe to call when the webhook may not have arrived yet.
 */
export async function checkPaymentStatus(
  orderId: string
): Promise<{ success: boolean; status?: PaymentStatus; error?: string }> {
  try {
    const order = await getOrder(orderId);
    if (!order) return { success: false, error: "Order not found" };

    if (order.paymentProvider !== "mercadopago") {
      return { success: true, status: order.paymentStatus };
    }

    const search = await searchPaymentsByExternalReference(orderId);
    const results = (search as { results?: Array<{ id: number; status: string }> } | null)?.results;
    if (!results || results.length === 0) {
      return { success: true, status: order.paymentStatus };
    }

    const latest = results.reduce((best, p) => (p.id > best.id ? p : best), results[0]);
    const newStatus = mapMercadoPagoStatus(latest.status);

    if (newStatus !== order.paymentStatus || order.paymentId !== String(latest.id)) {
      await updateOrderPayment(orderId, String(latest.id), newStatus, {
        providerStatus: latest.status,
      });
    }

    return { success: true, status: newStatus };
  } catch (error) {
    console.error("Failed to check payment status:", error);
    return { success: false, error: "Failed to check payment status" };
  }
}
