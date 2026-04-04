import { FirestoreTimestamp, PaymentProvider } from "./order";

export type TicketStatus = "valid" | "used" | "cancelled";

export interface GemaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: FirestoreTimestamp;
  location: string;
  capacity: number;
  ticketsSold: number;
  price: number;
  imageUrl?: string;
  active: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: FirestoreTimestamp;
  eventLocation: string;
  code: string; // 6-digit alphanumeric
  buyerEmail: string;
  buyerName?: string;
  buyerId?: string;
  status: TicketStatus;
  usedAt?: FirestoreTimestamp;
  price: number;
  paymentProvider?: PaymentProvider;
  paymentId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface EventInput {
  title: string;
  description: string;
  date: string; // ISO string from form
  location: string;
  capacity: number;
  price: number;
  imageUrl?: string;
}

export interface TicketPurchaseInput {
  eventId: string;
  buyerEmail: string;
  buyerName?: string;
  buyerId?: string;
  paymentProvider?: PaymentProvider;
}
