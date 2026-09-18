/**
 * Sends sample purchase emails through Resend to check the domain setup
 * without making a real purchase.
 *
 *   pnpm email:test tu@mail.com
 *
 * Reads RESEND_API_KEY / RESEND_FROM_EMAIL / RESEND_REPLY_TO from .env.local.
 */
import { sendEmail } from "@/lib/resend";
import { DownloadDeliveryEmail } from "@/components/email/DownloadDelivery";
import { PurchaseConfirmationEmail } from "@/components/email/PurchaseConfirmation";
import type { Order, DownloadLink, FirestoreTimestamp } from "@/types";

const to = process.argv[2];
if (!to) {
  console.error("Uso: pnpm email:test tu@mail.com");
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error("Falta RESEND_API_KEY en .env.local");
  process.exit(1);
}

function timestamp(date: Date): FirestoreTimestamp {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  };
}

const now = new Date();
const order: Order = {
  id: "test-order-000001",
  userEmail: to,
  items: [
    {
      bookId: "libro-de-prueba",
      bookTitle: "Libro de prueba",
      bookAuthor: "GEMA Editorial",
      format: "pdf",
      price: 10000,
      quantity: 1,
    },
  ],
  subtotal: 10000,
  shippingCost: 0,
  total: 10000,
  paymentProvider: "mercadopago",
  paymentStatus: "completed",
  orderStatus: "paid",
  hasDigitalItems: true,
  hasPrintItems: false,
  emailSent: false,
  createdAt: timestamp(now),
  updatedAt: timestamp(now),
};

const downloadLinks: DownloadLink[] = [
  {
    bookId: "libro-de-prueba",
    format: "pdf",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://editorialgema.com"}/mi-biblioteca`,
    expiresAt: timestamp(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
    downloadCount: 0,
    maxDownloads: 5,
  },
];

async function main() {
  const results = [
    await sendEmail({
      to,
      subject: "[Prueba] Tus libros digitales están listos - GEMA",
      react: DownloadDeliveryEmail({ order, downloadLinks }),
    }),
    await sendEmail({
      to,
      subject: "[Prueba] Confirmación de compra - GEMA",
      react: PurchaseConfirmationEmail({ order }),
    }),
  ];

  for (const result of results) {
    console.log(result.success ? "✓ enviado" : "✗ falló", JSON.stringify(result.success ? result.data : result.error));
  }
  if (results.some((r) => !r.success)) process.exit(1);
}

main();
