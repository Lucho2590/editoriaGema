/**
 * Emails to the store's team about sales. Recipients are configured in
 * /admin/notificaciones (Firestore `settings/notifications`).
 *
 * Deliberately NOT server actions: exported "use server" functions are public
 * endpoints, and these must only be triggered by the order flow itself.
 */
import { sendEmail } from "@/lib/resend";
import { NOTIFICATIONS_DOC_ID, readSettingsDoc } from "@/lib/settings/store";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  AdminNotificationEmail,
  PAYMENT_METHOD_LABELS,
} from "@/components/email/AdminNotification";
import { TransferSubmittedNotification } from "@/components/email/TransferSubmittedNotification";

export type AdminNotificationEvent = "sale" | "transfer";

export interface NotificationSettingsRaw {
  recipients?: string[];
  notifySales?: boolean;
  notifyTransfers?: boolean;
  updatedAt?: unknown;
  updatedBy?: string;
}

/**
 * Who should hear about `event`. Falls back to ADMIN_EMAIL only while no
 * recipients have been configured in the admin.
 */
export async function getAdminRecipients(event: AdminNotificationEvent): Promise<string[]> {
  const settings = await readSettingsDoc<NotificationSettingsRaw>(NOTIFICATIONS_DOC_ID).catch(
    (error) => {
      console.error("Failed to read notification settings:", error);
      return null;
    }
  );

  const enabled = event === "sale" ? settings?.notifySales : settings?.notifyTransfers;
  if (enabled === false) return [];

  if (settings?.recipients?.length) return settings.recipients;
  return process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];
}

function orderRef(order: Order): string {
  return `#${order.id.slice(-6).toUpperCase()}`;
}

/**
 * A paid order that needs no admin action (MercadoPago / Stripe).
 */
export async function notifyNewSale(order: Order) {
  const to = await getAdminRecipients("sale");
  if (to.length === 0) return { success: true, skipped: true };

  const method = PAYMENT_METHOD_LABELS[order.paymentProvider] || order.paymentProvider;
  return sendEmail({
    to,
    subject: `Nueva venta por ${method} — ${formatCurrency(order.total)} — ${orderRef(order)}`,
    react: AdminNotificationEmail({ order }),
  });
}

/**
 * The buyer submitted a bank transfer receipt; someone has to check the money
 * arrived and approve it in /admin/pedidos.
 */
export async function notifyTransferToVerify(order: Order) {
  const to = await getAdminRecipients("transfer");
  if (to.length === 0) return { success: true, skipped: true };

  return sendEmail({
    to,
    subject: `Nueva venta por transferencia: verificala — ${formatCurrency(order.total)} — ${orderRef(order)}`,
    react: TransferSubmittedNotification({ order }),
  });
}
