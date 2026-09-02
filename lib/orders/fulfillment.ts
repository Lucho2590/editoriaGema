/**
 * Order fulfillment: payment status transitions and everything they trigger.
 *
 * Deliberately NOT server actions. `updateOrderPayment` marks an order paid and
 * kicks off fulfillment (download links, library grant, emails); as an exported
 * action it would be a public endpoint anyone could POST to. The webhook
 * handlers and the payment-status poller import it directly instead.
 */
import { adminDb, adminStorage, isAdminReady } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp as ClientTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { Order, OrderItem, PaymentStatus, DownloadLink } from "@/types";
import {
  sendPurchaseConfirmation,
  sendDownloadEmail,
  sendAdminNotification,
} from "@/server/actions/emails";

const ORDERS_COLLECTION = "orders";
const USER_LIBRARY_COLLECTION = "user_library";

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    if (!isAdminReady || !adminDb) {
      const docSnap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }

    const docSnap = await adminDb.collection(ORDERS_COLLECTION).doc(orderId).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Order;
  } catch (error) {
    console.error("Failed to get order:", error);
    return null;
  }
}

/**
 * Update order payment status.
 *
 * Idempotent: if the order is already in `status` and has the same paymentId,
 * this is a no-op. The transition from non-completed → completed triggers
 * `processCompletedOrder` exactly once (gated by `emailSent`).
 */
export async function updateOrderPayment(
  orderId: string,
  paymentId: string,
  status: PaymentStatus,
  extra?: { providerStatus?: string; preferenceId?: string }
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();
    const useAdmin = isAdminReady && adminDb;

    const order = await getOrderById(orderId);
    if (!order) return { success: false, error: "Order not found" };

    const sameStatus = order.paymentStatus === status;
    const samePayment = !order.paymentId || order.paymentId === paymentId;
    if (sameStatus && samePayment && order.emailSent) {
      return { success: true, skipped: true };
    }

    const update: Record<string, unknown> = {
      paymentId,
      paymentStatus: status,
      orderStatus: status === "completed" ? "paid" : order.orderStatus,
      updatedAt: now,
    };
    if (extra?.providerStatus) update.providerStatus = extra.providerStatus;
    if (extra?.preferenceId) update.preferenceId = extra.preferenceId;

    if (useAdmin) {
      await adminDb!.collection(ORDERS_COLLECTION).doc(orderId).update(update);
    } else {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), update);
    }

    if (status === "completed" && !order.emailSent) {
      await processCompletedOrder(orderId);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update order payment:", error);
    return { success: false, error: "Failed to update order" };
  }
}

/**
 * Process a completed order
 */
async function processCompletedOrder(orderId: string): Promise<void> {
  try {
    const order = await getOrderById(orderId);
    if (!order) return;

    // Generate download links for digital items (requires admin SDK)
    if (order.hasDigitalItems && isAdminReady && adminDb) {
      const downloadLinks = await generateDownloadLinks(order.items);

      await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update({ downloadLinks });

      // Send download email
      await sendDownloadEmail(order.userEmail, order, downloadLinks);

      // Update user library
      if (order.userId) {
        await updateUserLibrary(order.userId, order, downloadLinks);
      }
    }

    // Send confirmation email
    await sendPurchaseConfirmation(order.userEmail, order);

    // Notify admin
    await sendAdminNotification(order);

    // Mark email as sent
    if (isAdminReady && adminDb) {
      await adminDb.collection(ORDERS_COLLECTION).doc(orderId).update({ emailSent: true });
    } else {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { emailSent: true });
    }
  } catch (error) {
    console.error("Failed to process completed order:", error);
  }
}

/**
 * Generate signed download URLs for digital items
 */
async function generateDownloadLinks(items: OrderItem[]): Promise<DownloadLink[]> {
  if (!isAdminReady || !adminStorage || !adminDb) {
    return [];
  }

  const digitalItems = items.filter((item) => item.format === "pdf" || item.format === "epub");
  const links: DownloadLink[] = [];

  for (const item of digitalItems) {
    try {
      const bookDoc = await adminDb.collection("books").doc(item.bookId).get();
      if (!bookDoc.exists) continue;

      const bookData = bookDoc.data();
      const fileUrl = item.format === "pdf" ? bookData?.pdfFileUrl : bookData?.epubFileUrl;

      if (!fileUrl) continue;

      const bucket = adminStorage.bucket();
      const filePath = extractStoragePath(fileUrl);
      const file = bucket.file(filePath);

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      links.push({
        bookId: item.bookId,
        format: item.format,
        url: signedUrl,
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
        maxDownloads: 5,
      });
    } catch (error) {
      console.error(`Failed to generate download link for ${item.bookId}:`, error);
    }
  }

  return links;
}

/**
 * Extract storage path from full URL
 */
function extractStoragePath(url: string): string {
  const match = url.match(/\/o\/(.+?)\?/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return url;
}

/**
 * Update user's digital library
 */
async function updateUserLibrary(userId: string, order: Order, downloadLinks: DownloadLink[]): Promise<void> {
  if (!isAdminReady || !adminDb) return;

  for (const item of order.items) {
    if (item.format !== "pdf" && item.format !== "epub") continue;

    const downloadLink = downloadLinks.find((l) => l.bookId === item.bookId && l.format === item.format);
    const bookDoc = await adminDb.collection("books").doc(item.bookId).get();
    const bookData = bookDoc.data();

    const purchase = {
      orderId: order.id,
      bookId: item.bookId,
      bookTitle: item.bookTitle,
      bookAuthor: item.bookAuthor,
      bookCover: bookData?.coverImage || "",
      format: item.format,
      purchasedAt: Timestamp.now(),
      downloadUrl: downloadLink?.url,
    };

    const libraryRef = adminDb.collection(USER_LIBRARY_COLLECTION).doc(userId);
    const libraryDoc = await libraryRef.get();

    if (libraryDoc.exists) {
      const currentPurchases = libraryDoc.data()?.purchases || [];
      await libraryRef.update({
        purchases: [...currentPurchases, purchase],
      });
    } else {
      await libraryRef.set({
        userId,
        purchases: [purchase],
      });
    }
  }
}
