"use server";

import { sendEmail } from "@/lib/resend";
import { Order, DownloadLink } from "@/types";
import { PurchaseConfirmationEmail } from "@/components/email/PurchaseConfirmation";
import { DownloadDeliveryEmail } from "@/components/email/DownloadDelivery";
import { AdminNotificationEmail } from "@/components/email/AdminNotification";
import { TransferSubmittedNotification } from "@/components/email/TransferSubmittedNotification";
import { WelcomeEmail } from "@/components/email/WelcomeEmail";
import { TicketEmail } from "@/components/email/TicketEmail";
import { generateQRDataUrl } from "@/lib/qr";
import { formatDate } from "@/lib/utils";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gema-editorial.com";

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(to: string, displayName?: string) {
  return sendEmail({
    to,
    subject: "Bienvenido/a a GEMA",
    react: WelcomeEmail({ displayName }),
  });
}

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
 * Send ticket email with QR code
 */
export async function sendTicketEmail(
  to: string,
  ticket: {
    code: string;
    eventTitle: string;
    eventDate: Date;
    eventLocation: string;
    buyerName?: string;
    price: number;
  }
) {
  const qrDataUrl = await generateQRDataUrl(ticket.code);
  const formattedDate = formatDate(ticket.eventDate);

  return sendEmail({
    to,
    subject: `Tu entrada para ${ticket.eventTitle} - GEMA`,
    react: TicketEmail({
      code: ticket.code,
      eventTitle: ticket.eventTitle,
      eventDate: formattedDate,
      eventLocation: ticket.eventLocation,
      buyerName: ticket.buyerName,
      price: ticket.price,
      qrDataUrl,
    }),
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

/**
 * Notify admin that a customer submitted bank transfer details and is waiting
 * for manual confirmation.
 */
export async function sendTransferSubmittedNotification(order: Order) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `Transferencia pendiente - #${order.id.slice(-6).toUpperCase()} - GEMA`,
    react: TransferSubmittedNotification({ order }),
  });
}
