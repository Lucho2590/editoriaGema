"use server";

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
  Timestamp as ClientTimestamp,
} from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { GemaEvent, Ticket, TicketStatus, EventInput, TicketPurchaseInput } from "@/types";
import { sendTicketEmail } from "./emails";
import { assertAdmin } from "@/lib/auth/session";

const EVENTS_COLLECTION = "events";
const TICKETS_COLLECTION = "tickets";

// Serialize Firestore timestamps to plain objects for client components
function serializeTimestamp(ts: unknown): { seconds: number; nanoseconds: number } | null {
  if (!ts) return null;
  if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
    const t = ts as { _seconds: number; _nanoseconds: number };
    return { seconds: t._seconds, nanoseconds: t._nanoseconds };
  }
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    const t = ts as { seconds: number; nanoseconds: number };
    return { seconds: t.seconds, nanoseconds: t.nanoseconds };
  }
  return null;
}

function serializeEvent(doc: { id: string; [key: string]: unknown }): GemaEvent {
  return {
    ...doc,
    date: serializeTimestamp(doc.date),
    createdAt: serializeTimestamp(doc.createdAt),
    updatedAt: serializeTimestamp(doc.updatedAt),
  } as unknown as GemaEvent;
}

function serializeTicket(doc: { id: string; [key: string]: unknown }): Ticket {
  return {
    ...doc,
    eventDate: serializeTimestamp(doc.eventDate),
    createdAt: serializeTimestamp(doc.createdAt),
    updatedAt: serializeTimestamp(doc.updatedAt),
    usedAt: doc.usedAt ? serializeTimestamp(doc.usedAt) : undefined,
  } as unknown as Ticket;
}

function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0, 1 para evitar confusión
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueTicketCode(): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const code = generateTicketCode();
    const exists = await checkTicketCodeExists(code);
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique ticket code");
}

async function checkTicketCodeExists(code: string): Promise<boolean> {
  if (isAdminReady && adminDb) {
    const snapshot = await adminDb
      .collection(TICKETS_COLLECTION)
      .where("code", "==", code)
      .limit(1)
      .get();
    return !snapshot.empty;
  }
  const q = query(
    collection(db, TICKETS_COLLECTION),
    where("code", "==", code)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// ---- EVENTS ----

export async function createEvent(input: EventInput): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();
    const slug = input.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const eventDate = isAdminReady
      ? Timestamp.fromDate(new Date(input.date))
      : ClientTimestamp.fromDate(new Date(input.date));

    const event = {
      title: input.title,
      slug,
      description: input.description,
      date: eventDate,
      location: input.location,
      capacity: input.capacity,
      ticketsSold: 0,
      price: input.price,
      imageUrl: input.imageUrl || null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    if (isAdminReady && adminDb) {
      const docRef = await adminDb.collection(EVENTS_COLLECTION).add(event);
      return { success: true, eventId: docRef.id };
    }

    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event);
    return { success: true, eventId: docRef.id };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Error al crear el evento" };
  }
}

export async function getEvents(onlyActive = false): Promise<GemaEvent[]> {
  try {
    if (isAdminReady && adminDb) {
      let ref = adminDb.collection(EVENTS_COLLECTION).orderBy("date", "asc") as FirebaseFirestore.Query;
      if (onlyActive) {
        ref = ref.where("active", "==", true);
      }
      const snapshot = await ref.get();
      return snapshot.docs.map((doc) => serializeEvent({ id: doc.id, ...doc.data() }));
    }

    const q = onlyActive
      ? query(collection(db, EVENTS_COLLECTION), where("active", "==", true), orderBy("date", "asc"))
      : query(collection(db, EVENTS_COLLECTION), orderBy("date", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => serializeEvent({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to get events:", error);
    return [];
  }
}

export async function getEvent(eventId: string): Promise<GemaEvent | null> {
  try {
    if (isAdminReady && adminDb) {
      const docSnap = await adminDb.collection(EVENTS_COLLECTION).doc(eventId).get();
      if (!docSnap.exists) return null;
      return serializeEvent({ id: docSnap.id, ...docSnap.data() });
    }
    const docSnap = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
    if (!docSnap.exists()) return null;
    return serializeEvent({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error("Failed to get event:", error);
    return null;
  }
}

export async function getEventBySlug(slug: string): Promise<GemaEvent | null> {
  try {
    if (isAdminReady && adminDb) {
      const snapshot = await adminDb
        .collection(EVENTS_COLLECTION)
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return serializeEvent({ id: doc.id, ...doc.data() });
    }
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where("slug", "==", slug)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return serializeEvent({ id: d.id, ...d.data() });
  } catch (error) {
    console.error("Failed to get event by slug:", error);
    return null;
  }
}

export async function updateEvent(
  eventId: string,
  data: Partial<EventInput> & { active?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();
    const update: Record<string, unknown> = { updatedAt: now };

    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.location !== undefined) update.location = data.location;
    if (data.capacity !== undefined) update.capacity = data.capacity;
    if (data.price !== undefined) update.price = data.price;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.active !== undefined) update.active = data.active;
    if (data.date !== undefined) {
      update.date = isAdminReady
        ? Timestamp.fromDate(new Date(data.date))
        : ClientTimestamp.fromDate(new Date(data.date));
    }

    if (isAdminReady && adminDb) {
      await adminDb.collection(EVENTS_COLLECTION).doc(eventId).update(update);
    } else {
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), update);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Error al actualizar el evento" };
  }
}

// ---- TICKETS ----

export async function purchaseTicket(
  input: TicketPurchaseInput
): Promise<{ success: boolean; ticketId?: string; code?: string; error?: string }> {
  try {
    const event = await getEvent(input.eventId);
    if (!event) return { success: false, error: "Evento no encontrado" };
    if (!event.active) return { success: false, error: "El evento no está activo" };
    if (event.ticketsSold >= event.capacity) return { success: false, error: "No quedan entradas disponibles" };

    const code = await getUniqueTicketCode();
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();

    const ticket: Record<string, unknown> = {
      eventId: input.eventId,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      code,
      buyerEmail: input.buyerEmail,
      status: "valid" as TicketStatus,
      price: event.price,
      createdAt: now,
      updatedAt: now,
    };

    if (input.buyerName) ticket.buyerName = input.buyerName;
    if (input.buyerId) ticket.buyerId = input.buyerId;
    if (input.paymentProvider) ticket.paymentProvider = input.paymentProvider;

    let ticketId: string;

    if (isAdminReady && adminDb) {
      const docRef = await adminDb.collection(TICKETS_COLLECTION).add(ticket);
      ticketId = docRef.id;
      // Increment ticketsSold
      const eventRef = adminDb.collection(EVENTS_COLLECTION).doc(input.eventId);
      await eventRef.update({ ticketsSold: (event.ticketsSold || 0) + 1, updatedAt: now });
    } else {
      const docRef = await addDoc(collection(db, TICKETS_COLLECTION), ticket);
      ticketId = docRef.id;
      await updateDoc(doc(db, EVENTS_COLLECTION, input.eventId), {
        ticketsSold: (event.ticketsSold || 0) + 1,
        updatedAt: now,
      });
    }

    // Send ticket email with QR
    const dateVal = event.date as unknown as { seconds: number } | { toDate: () => Date } | string;
    const eventDate = typeof dateVal === "object" && dateVal !== null && "seconds" in dateVal
      ? new Date(dateVal.seconds * 1000)
      : typeof dateVal === "object" && dateVal !== null && "toDate" in dateVal
      ? dateVal.toDate()
      : new Date(dateVal as string);
    await sendTicketEmail(input.buyerEmail, {
      code,
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location,
      buyerName: input.buyerName,
      price: event.price,
    });

    return { success: true, ticketId, code };
  } catch (error) {
    console.error("Failed to purchase ticket:", error);
    return { success: false, error: "Error al comprar la entrada" };
  }
}

export async function simulateTicketPurchase(
  input: TicketPurchaseInput
): Promise<{ success: boolean; ticketId?: string; code?: string; error?: string }> {
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: "Simulación no disponible en producción" };
  }
  return purchaseTicket(input);
}

/**
 * NOT guarded with assertAdmin: the public door-staff page at
 * /validar-entrada also calls this, and it is gated only by
 * NEXT_PUBLIC_VALIDATOR_PIN — a constant baked into the client bundle, so not
 * an access control at all. Closing this properly needs a server-verified
 * validator token, which is tracked separately.
 */
export async function validateTicket(
  code: string
): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
    const upperCode = code.toUpperCase().trim();

    let ticket: Ticket | null = null;
    let ticketRef: FirebaseFirestore.DocumentReference | null = null;
    let clientTicketId: string | null = null;

    if (isAdminReady && adminDb) {
      const snapshot = await adminDb
        .collection(TICKETS_COLLECTION)
        .where("code", "==", upperCode)
        .limit(1)
        .get();

      if (snapshot.empty) return { success: false, error: "Código no encontrado" };
      const d = snapshot.docs[0];
      ticket = serializeTicket({ id: d.id, ...d.data() });
      ticketRef = d.ref;
    } else {
      const q = query(
        collection(db, TICKETS_COLLECTION),
        where("code", "==", upperCode)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return { success: false, error: "Código no encontrado" };
      const d = snapshot.docs[0];
      ticket = serializeTicket({ id: d.id, ...d.data() });
      clientTicketId = d.id;
    }

    if (!ticket) return { success: false, error: "Código no encontrado" };

    if (ticket.status === "used") {
      return { success: false, error: "Esta entrada ya fue utilizada", ticket };
    }
    if (ticket.status === "cancelled") {
      return { success: false, error: "Esta entrada fue cancelada", ticket };
    }

    // Mark as used
    const now = isAdminReady ? Timestamp.now() : ClientTimestamp.now();

    if (isAdminReady && adminDb && ticketRef) {
      await ticketRef.update({ status: "used", usedAt: now, updatedAt: now });
    } else if (clientTicketId) {
      await updateDoc(doc(db, TICKETS_COLLECTION, clientTicketId), {
        status: "used",
        usedAt: now,
        updatedAt: now,
      });
    }

    ticket.status = "used";
    return { success: true, ticket };
  } catch (error) {
    console.error("Failed to validate ticket:", error);
    return { success: false, error: "Error al validar la entrada" };
  }
}

export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  const auth = await assertAdmin();
  if (!auth.ok) return [];

  try {
    if (isAdminReady && adminDb) {
      const snapshot = await adminDb
        .collection(TICKETS_COLLECTION)
        .where("eventId", "==", eventId)
        .orderBy("createdAt", "desc")
        .get();
      return snapshot.docs.map((doc) => serializeTicket({ id: doc.id, ...doc.data() }));
    }

    const q = query(
      collection(db, TICKETS_COLLECTION),
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => serializeTicket({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to get event tickets:", error);
    return [];
  }
}
