import { Timestamp } from "firebase/firestore";
import { BookFormat } from "./book";

export type PaymentProvider = "stripe" | "mercadopago";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  format: BookFormat;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  userId?: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentProvider: PaymentProvider;
  paymentId?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  hasDigitalItems: boolean;
  hasPrintItems: boolean;
  shippingAddress?: ShippingAddress;
  downloadLinks?: DownloadLink[];
  emailSent: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DownloadLink {
  bookId: string;
  format: BookFormat;
  url: string;
  expiresAt: Timestamp;
  downloadCount: number;
  maxDownloads: number;
}

export interface OrderInput {
  userEmail: string;
  userId?: string;
  items: OrderItem[];
  paymentProvider: PaymentProvider;
  shippingAddress?: ShippingAddress;
}
