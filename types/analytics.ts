import { Timestamp } from "firebase/firestore";

export type AnalyticsEventType =
  | "page_view"
  | "book_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "purchase_started"
  | "purchase_completed"
  | "purchase_failed"
  | "download_started"
  | "newsletter_signup";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  data: Record<string, unknown>;
  page: string;
  referrer?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  data?: Record<string, unknown>;
  page: string;
  referrer?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalBooks: number;
  digitalSales: number;
  printSales: number;
  recentOrders: number;
  topBooks: Array<{
    bookId: string;
    title: string;
    count: number;
  }>;
}
