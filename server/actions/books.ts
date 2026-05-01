"use server";

import { revalidatePath } from "next/cache";
import { adminDb, isAdminReady } from "@/lib/firebase-admin";
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
  deleteDoc,
  Timestamp as ClientTimestamp
} from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { Book, BookInput } from "@/types";
import { slugify } from "@/lib/utils";

const BOOKS_COLLECTION = "books";

/**
 * Serialize Firestore document to plain object
 */
function serializeBook(doc: { id: string; data: () => Record<string, unknown> }): Book {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  } as Book;
}

function serializeTimestamp(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();

  // Firebase Admin Timestamp
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    const ts = timestamp as { _seconds: number; _nanoseconds: number };
    return new Date(ts._seconds * 1000).toISOString();
  }

  // Firestore Client Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }

  // Already a string
  if (typeof timestamp === 'string') return timestamp;

  return new Date().toISOString();
}

/**
 * Get all published books
 */
export async function getBooks(): Promise<Book[]> {
  try {
    // Use client SDK if admin is not configured
    if (!isAdminReady || !adminDb) {
      const q = query(
        collection(db, BOOKS_COLLECTION),
        where("published", "==", true),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() }));
    }

    const snapshot = await adminDb
      .collection(BOOKS_COLLECTION)
      .where("published", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  } catch (error) {
    console.error("Failed to get books:", error);
    return [];
  }
}

/**
 * Get all books (including unpublished) for admin
 */
export async function getAllBooks(): Promise<Book[]> {
  try {
    if (!isAdminReady || !adminDb) {
      const q = query(collection(db, BOOKS_COLLECTION), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() }));
    }

    const snapshot = await adminDb.collection(BOOKS_COLLECTION).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  } catch (error) {
    console.error("Failed to get all books:", error);
    return [];
  }
}

/**
 * Get featured books
 */
export async function getFeaturedBooks(): Promise<Book[]> {
  try {
    if (!isAdminReady || !adminDb) {
      const q = query(
        collection(db, BOOKS_COLLECTION),
        where("published", "==", true),
        where("featured", "==", true)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() }));
    }

    const snapshot = await adminDb
      .collection(BOOKS_COLLECTION)
      .where("published", "==", true)
      .where("featured", "==", true)
      .limit(6)
      .get();

    return snapshot.docs.map((d) => serializeBook({ id: d.id, data: () => d.data() as Record<string, unknown> }));
  } catch (error) {
    console.error("Failed to get featured books:", error);
    return [];
  }
}

/**
 * Get book by slug
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  try {
    if (!isAdminReady || !adminDb) {
      const q = query(collection(db, BOOKS_COLLECTION), where("slug", "==", slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      return serializeBook({ id: d.id, data: () => d.data() });
    }

    const snapshot = await adminDb.collection(BOOKS_COLLECTION).where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return serializeBook({ id: d.id, data: () => d.data() as Record<string, unknown> });
  } catch (error) {
    console.error("Failed to get book by slug:", error);
    return null;
  }
}

/**
 * Get book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    if (!isAdminReady || !adminDb) {
      const docSnap = await getDoc(doc(db, BOOKS_COLLECTION, id));
      if (!docSnap.exists()) return null;
      return serializeBook({ id: docSnap.id, data: () => docSnap.data() as Record<string, unknown> });
    }

    const docSnap = await adminDb.collection(BOOKS_COLLECTION).doc(id).get();
    if (!docSnap.exists) return null;
    return serializeBook({ id: docSnap.id, data: () => docSnap.data() as Record<string, unknown> });
  } catch (error) {
    console.error("Failed to get book by ID:", error);
    return null;
  }
}

/**
 * Create a new book
 */
export async function createBook(input: BookInput): Promise<{ success: boolean; bookId?: string; error?: string }> {
  try {
    const slug = input.slug || slugify(input.title);
    const existing = await getBookBySlug(slug);
    if (existing) {
      return { success: false, error: "A book with this slug already exists" };
    }

    const bookData = {
      ...input,
      slug,
      featured: input.featured ?? false,
      published: input.published ?? false,
      createdAt: isAdminReady ? Timestamp.now() : ClientTimestamp.now(),
      updatedAt: isAdminReady ? Timestamp.now() : ClientTimestamp.now(),
    };

    let bookId: string;
    if (!isAdminReady || !adminDb) {
      const docRef = await addDoc(collection(db, BOOKS_COLLECTION), bookData);
      bookId = docRef.id;
    } else {
      const docRef = await adminDb.collection(BOOKS_COLLECTION).add(bookData);
      bookId = docRef.id;
    }

    revalidateBookPaths(slug);
    return { success: true, bookId };
  } catch (error) {
    console.error("Failed to create book:", error);
    return { success: false, error: "Failed to create book" };
  }
}

/**
 * Update a book
 */
export async function updateBook(
  id: string,
  input: Partial<BookInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (input.slug) {
      const existing = await getBookBySlug(input.slug);
      if (existing && existing.id !== id) {
        return { success: false, error: "A book with this slug already exists" };
      }
    }

    const previous = await getBookById(id);

    const updateData = {
      ...input,
      updatedAt: isAdminReady ? Timestamp.now() : ClientTimestamp.now(),
    };

    if (!isAdminReady || !adminDb) {
      await updateDoc(doc(db, BOOKS_COLLECTION, id), updateData);
    } else {
      await adminDb.collection(BOOKS_COLLECTION).doc(id).update(updateData);
    }

    revalidateBookPaths(previous?.slug, input.slug);
    revalidatePath(`/admin/libros/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update book:", error);
    return { success: false, error: "Failed to update book" };
  }
}

/**
 * Delete a book
 */
export async function deleteBook(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const previous = await getBookById(id);

    if (!isAdminReady || !adminDb) {
      await deleteDoc(doc(db, BOOKS_COLLECTION, id));
    } else {
      await adminDb.collection(BOOKS_COLLECTION).doc(id).delete();
    }

    revalidateBookPaths(previous?.slug);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete book:", error);
    return { success: false, error: "Failed to delete book" };
  }
}

/**
 * Invalidate Next.js cache for all pages that show book data
 */
function revalidateBookPaths(...slugs: (string | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/libros");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/libro/${slug}`);
  }
}

/**
 * Upload book file (PDF or EPUB) and return the URL
 */
export async function uploadBookFile(
  bookId: string,
  fileBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // This requires Firebase Admin for signed URLs
  if (!isAdminReady) {
    return { success: false, error: "Firebase Admin required for file uploads" };
  }

  try {
    const { adminStorage } = await import("@/lib/firebase-admin");
    if (!adminStorage) {
      return { success: false, error: "Storage not configured" };
    }

    const bucket = adminStorage.bucket();
    const filePath = `books/${bookId}/${filename}`;
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
      metadata: { contentType },
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    return { success: true, url };
  } catch (error) {
    console.error("Failed to upload book file:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

/**
 * Toggle book published status
 */
export async function toggleBookPublished(id: string, published: boolean): Promise<{ success: boolean; error?: string }> {
  return updateBook(id, { published });
}

/**
 * Toggle book featured status
 */
export async function toggleBookFeatured(id: string, featured: boolean): Promise<{ success: boolean; error?: string }> {
  return updateBook(id, { featured });
}
