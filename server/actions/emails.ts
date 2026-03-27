"use server";

import { sendEmail } from "@/lib/resend";
import { Order, DownloadLink } from "@/types";
import { PurchaseConfirmationEmail } from "@/components/email/PurchaseConfirmation";
import { DownloadDeliveryEmail } from "@/components/email/DownloadDelivery";
import { AdminNotificationEmail } from "@/components/email/AdminNotification";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gema-editorial.com";

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmation(to: string, order: Order) {
  return sendEmail({
    to,
    subject: `Confirmación de compra - GEMA #${order.id.slice(-6).toUpperCase()}`,
    react: PurchaseConfirmationEmail({ order }),
  });
}

/**
 * Send digital download delivery email
 */
export async function sendDownloadEmail(to: string, order: Order, downloadLinks: DownloadLink[]) {
  return sendEmail({
    to,
    subject: "Tus libros digitales están listos - GEMA",
    react: DownloadDeliveryEmail({ order, downloadLinks }),
  });
}

/**
 * Send admin notification for new order
 */
export async function sendAdminNotification(order: Order) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Nueva venta - $${order.total} - GEMA`,
    react: AdminNotificationEmail({ order }),
  });
}
