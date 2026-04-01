import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { AnalyticsEventInput, AnalyticsEventType } from "@/types";

const COLLECTION_NAME = "analytics_events";

/**
 * Generate a unique session ID for the current browser session
 */
export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server";
  }

  let sessionId = sessionStorage.getItem("gema_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("gema_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  type: AnalyticsEventType,
  data?: Record<string, unknown>,
  userId?: string
): Promise<void> {
  try {
    // Build event object, filtering out undefined values
    const event: Record<string, unknown> = {
      type,
      sessionId: getSessionId(),
      data: data || {},
      page: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (userId) event.userId = userId;
    if (typeof document !== "undefined" && document.referrer) {
      event.referrer = document.referrer;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      event.userAgent = navigator.userAgent;
    }

    await addDoc(collection(db, COLLECTION_NAME), event);
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.error("Analytics tracking failed:", error);
  }
}

/**
 * Track page view
 */
export function trackPageView(page?: string): void {
  trackEvent("page_view", { page: page || window.location.pathname });
}

/**
 * Track book view
 */
export function trackBookView(bookId: string, bookTitle: string): void {
  trackEvent("book_view", { bookId, bookTitle });
}

/**
 * Track add to cart
 */
export function trackAddToCart(bookId: string, format: string, price: number): void {
  trackEvent("add_to_cart", { bookId, format, price });
}

/**
 * Track checkout started
 */
export function trackCheckoutStarted(itemCount: number, total: number): void {
  trackEvent("checkout_started", { itemCount, total });
}

/**
 * Track purchase completed
 */
export function trackPurchaseCompleted(orderId: string, total: number, itemCount: number): void {
  trackEvent("purchase_completed", { orderId, total, itemCount });
}

/**
 * Track download started
 */
export function trackDownloadStarted(bookId: string, format: string): void {
  trackEvent("download_started", { bookId, format });
}
