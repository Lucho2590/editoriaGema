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
import { sendPurchaseConfirmation, sendDownloadEmail, sendAdminNotification } from "./emails";

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

    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();

    const order = {
      userId: input.userId,
      userEmail: input.userEmail,
      items: input.items,
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      paymentProvider: input.paymentProvider,
      paymentStatus: "pending" as PaymentStatus,
      orderStatus: "pending" as const,
      hasDigitalItems,
      hasPrintItems,
      shippingAddress: input.shippingAddress,
      emailSent: false,
      createdAt: now,
      updatedAt: now,
    };

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
 * Update order payment status
 */
export async function updateOrderPayment(
  orderId: string,
  paymentId: string,
  status: PaymentStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();

    if (!isAdminReady || !adminDb) {
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return { success: false, error: "Order not found" };
      }

      const order = { id: orderSnap.id, ...orderSnap.data() } as Order;

      await updateDoc(orderRef, {
        paymentId,
        paymentStatus: status,
        orderStatus: status === "completed" ? "paid" : order.orderStatus,
        updatedAt: now,
      });

      if (status === "completed") {
        await processCompletedOrder(orderId);
      }

      return { success: true };
    }

    const orderRef = adminDb.collection(ORDERS_COLLECTION).doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return { success: false, error: "Order not found" };
    }

    const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

    await orderRef.update({
      paymentId,
      paymentStatus: status,
      orderStatus: status === "completed" ? "paid" : order.orderStatus,
      updatedAt: Timestamp.now(),
    });

    if (status === "completed") {
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
    const order = await getOrder(orderId);
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
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
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
 * Get orders for admin dashboard
 */
export async function getOrders(maxResults = 50): Promise<Order[]> {
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

/**
 * Get user's orders
 */
export async function getUserOrders(userEmail: string): Promise<Order[]> {
  try {
    if (!isAdminReady || !adminDb) {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where("userEmail", "==", userEmail),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
    }

    const snapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .where("userEmail", "==", userEmail)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
  } catch (error) {
    console.error("Failed to get user orders:", error);
    return [];
  }
}
