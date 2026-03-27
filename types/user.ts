import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPurchase {
  orderId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  format: string;
  purchasedAt: Timestamp;
  downloadUrl?: string;
}

export interface UserLibrary {
  userId: string;
  purchases: UserPurchase[];
}
