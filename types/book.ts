import { Timestamp } from "firebase/firestore";

export type BookFormat = "pdf" | "epub" | "print";

export interface BookFormats {
  pdf: boolean;
  epub: boolean;
  print: boolean;
}

export interface Book {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  year: number;
  coverImage: string;
  formats: BookFormats;
  pricePdf: number;
  priceEpub: number;
  pricePrint: number;
  pdfFileUrl?: string;
  epubFileUrl?: string;
  stockPrint: number;
  featured: boolean;
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BookInput {
  title: string;
  slug: string;
  author: string;
  description: string;
  year: number;
  coverImage: string;
  formats: BookFormats;
  pricePdf: number;
  priceEpub: number;
  pricePrint: number;
  pdfFileUrl?: string;
  epubFileUrl?: string;
  stockPrint: number;
  featured?: boolean;
  published?: boolean;
}

export interface CartItem {
  bookId: string;
  book: Book;
  format: BookFormat;
  quantity: number;
}

export function getBookPrice(book: Book, format: BookFormat): number {
  switch (format) {
    case "pdf":
      return book.pricePdf;
    case "epub":
      return book.priceEpub;
    case "print":
      return book.pricePrint;
    default:
      return 0;
  }
}

export function formatBookPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price);
}
