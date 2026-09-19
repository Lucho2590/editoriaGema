"use server";

import type { DocumentSnapshot, Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { assertSuperAdmin } from "@/lib/auth/session";
import { AUDIT_COLLECTION, logAudit, orderLabel } from "@/lib/audit/log";
import {
  AUDIT_ACTIONS,
  type ActivityRow,
  type ActivitySource,
  type AuditAction,
} from "@/lib/audit/actions";
import { deleteOrders } from "@/server/actions/orders";
import { formatCurrency } from "@/lib/utils";

const PAGE_SIZE = 100;
const MAX_DELETE = 500;

const PAYMENT_METHODS: Record<string, string> = {
  mercadopago: "MercadoPago",
  transfer: "Transferencia",
  stripe: "Stripe",
};

const PAYMENT_STATUSES: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Completado",
  failed: "Fallido",
  refunded: "Reembolsado",
};

const VISITOR_EVENTS: Record<string, string> = {
  page_view: "Visitó una página",
  book_view: "Vio un libro",
  add_to_cart: "Agregó al carrito",
  remove_from_cart: "Quitó del carrito",
  checkout_started: "Inició la compra",
  purchase_started: "Fue a pagar",
  purchase_completed: "Completó una compra",
  purchase_failed: "Falló un pago",
  download_started: "Descargó un libro",
  newsletter_signup: "Se suscribió al newsletter",
};

// Which documents each tab may delete (defense against forged paths)
const DELETABLE_PATHS: Record<ActivitySource, RegExp> = {
  orders: /^orders\/[^/]+$/,
  visitors: /^analytics_events\/[^/]+$/,
  mercadopago: /^orders\/[^/]+\/events\/[^/]+$/,
  admin: /^audit_logs\/[^/]+$/,
};

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function orderRow(doc: DocumentSnapshot): ActivityRow {
  const o = doc.data() ?? {};
  const items = (o.items ?? []) as { bookTitle?: string; format?: string; price?: number }[];
  return {
    path: doc.ref.path,
    date: toIso(o.createdAt),
    title: `Pedido ${orderLabel(doc.id)} — ${formatCurrency(o.total ?? 0)}`,
    subtitle: [
      o.userEmail,
      PAYMENT_METHODS[o.paymentProvider] ?? o.paymentProvider,
      PAYMENT_STATUSES[o.paymentStatus] ?? o.paymentStatus,
    ]
      .filter(Boolean)
      .join(" · "),
    details: {
      items: items.map((i) => ({ title: i.bookTitle?.trim(), format: i.format, price: i.price })),
    },
  };
}

function visitorRow(doc: DocumentSnapshot): ActivityRow {
  const e = doc.data() ?? {};
  const data = (e.data ?? {}) as Record<string, unknown>;
  const extra = [
    typeof data.format === "string" ? data.format.toUpperCase() : null,
    typeof data.price === "number" ? formatCurrency(data.price) : null,
    typeof data.total === "number" ? `Total ${formatCurrency(data.total)}` : null,
  ].filter(Boolean);
  return {
    path: doc.ref.path,
    date: toIso(e.timestamp),
    title: VISITOR_EVENTS[e.type] ?? e.type,
    subtitle: [e.page, ...extra].filter(Boolean).join(" · "),
    details: { ...data, session: e.sessionId, userId: e.userId },
  };
}

function mercadoPagoRow(doc: DocumentSnapshot): ActivityRow {
  const e = doc.data() ?? {};
  const orderId = doc.ref.parent.parent?.id ?? "";
  return {
    path: doc.ref.path,
    date: toIso(e.receivedAt),
    title: `Aviso de pago — Pedido ${orderLabel(orderId)}`,
    subtitle: [
      PAYMENT_STATUSES[e.processedStatus] ?? e.processedStatus,
      e.verifiedMode === "test" ? "Modo prueba" : e.verifiedMode === "production" ? "Producción" : null,
      e.paymentMethod,
    ]
      .filter(Boolean)
      .join(" · "),
    details: {
      paymentId: e.dataId,
      processed: e.processed,
      skipped: e.skipped,
      error: e.processingError,
    },
  };
}

function adminRow(doc: DocumentSnapshot): ActivityRow {
  const a = doc.data() ?? {};
  const label = AUDIT_ACTIONS[a.action as AuditAction] ?? a.action;
  return {
    path: doc.ref.path,
    date: toIso(a.createdAt),
    title: a.target?.label ? `${label} — ${a.target.label}` : label,
    subtitle: a.actor?.email ?? a.actor?.uid,
    details: a.details,
  };
}

/** Webhook events live in orders/{id}/events; the top-level `events` collection is ticketed events */
async function getMercadoPagoEvents(): Promise<DocumentSnapshot[]> {
  const snapshot = await adminDb!.collectionGroup("events").get();
  return snapshot.docs
    .filter((doc) => doc.ref.parent.parent?.parent.id === "orders")
    .sort((a, b) => toIso(b.data().receivedAt).localeCompare(toIso(a.data().receivedAt)));
}

export async function getActivity(input: {
  source: ActivitySource;
  /** path of the last row already shown */
  cursor?: string;
}): Promise<{ success: boolean; rows: ActivityRow[]; nextCursor?: string; error?: string }> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { success: false, rows: [], error: auth.error };
  if (!adminDb) return { success: false, rows: [], error: "Firebase Admin no está configurado" };

  try {
    if (input.source === "mercadopago") {
      const docs = await getMercadoPagoEvents();
      const start = input.cursor ? docs.findIndex((d) => d.ref.path === input.cursor) + 1 : 0;
      const page = docs.slice(start, start + PAGE_SIZE);
      return {
        success: true,
        rows: page.map(mercadoPagoRow),
        nextCursor: start + PAGE_SIZE < docs.length ? page[page.length - 1].ref.path : undefined,
      };
    }

    const config = {
      orders: { collection: "orders", dateField: "createdAt", toRow: orderRow },
      visitors: { collection: "analytics_events", dateField: "timestamp", toRow: visitorRow },
      admin: { collection: AUDIT_COLLECTION, dateField: "createdAt", toRow: adminRow },
    }[input.source];

    let query: Query = adminDb.collection(config.collection).orderBy(config.dateField, "desc");
    if (input.cursor) {
      const cursorDoc = await adminDb.doc(input.cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    // One extra to know whether there is a next page
    const snapshot = await query.limit(PAGE_SIZE + 1).get();
    const docs = snapshot.docs.slice(0, PAGE_SIZE);
    return {
      success: true,
      rows: docs.map(config.toRow),
      nextCursor: snapshot.docs.length > PAGE_SIZE ? docs[docs.length - 1].ref.path : undefined,
    };
  } catch (error) {
    console.error(`Failed to get activity (${input.source}):`, error);
    return { success: false, rows: [], error: "No se pudo cargar" };
  }
}

export async function getActivityCounts(): Promise<Record<ActivitySource, number> | null> {
  const auth = await assertSuperAdmin();
  if (!auth.ok || !adminDb) return null;

  const count = async (name: string) => (await adminDb!.collection(name).count().get()).data().count;
  const [orders, visitors, admin, mercadopago] = await Promise.all([
    count("orders"),
    count("analytics_events"),
    count(AUDIT_COLLECTION),
    getMercadoPagoEvents().then((docs) => docs.length),
  ]);
  return { orders, visitors, mercadopago, admin };
}

/**
 * Permanently delete the selected records of one tab.
 */
export async function deleteActivity(input: {
  source: ActivitySource;
  paths: string[];
}): Promise<{ success: boolean; deleted: number; error?: string }> {
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { success: false, deleted: 0, error: auth.error };
  if (!adminDb) return { success: false, deleted: 0, error: "Firebase Admin no está configurado" };

  const paths = [...new Set(input.paths)];
  if (paths.length === 0) return { success: false, deleted: 0, error: "No hay nada seleccionado" };
  if (paths.length > MAX_DELETE) {
    return { success: false, deleted: 0, error: `Se pueden borrar hasta ${MAX_DELETE} por vez` };
  }
  if (!paths.every((path) => DELETABLE_PATHS[input.source].test(path))) {
    return { success: false, deleted: 0, error: "Selección inválida" };
  }

  // Orders also remove their webhook events and receipt, and keep a copy in the log
  if (input.source === "orders") {
    const res = await deleteOrders(paths.map((path) => path.split("/")[1]));
    return {
      success: res.success,
      deleted: res.deleted,
      error: res.error ?? (res.failed.length ? `No se pudieron borrar ${res.failed.length}` : undefined),
    };
  }

  try {
    for (let i = 0; i < paths.length; i += 400) {
      const batch = adminDb.batch();
      paths.slice(i, i + 400).forEach((path) => batch.delete(adminDb!.doc(path)));
      await batch.commit();
    }

    // Deleting admin log entries isn't itself logged; that would never end
    if (input.source !== "admin") {
      await logAudit(
        auth.user,
        input.source === "visitors" ? "activity.visitors_deleted" : "activity.mercadopago_deleted",
        { type: "activity", id: input.source, label: `${paths.length} registros` },
        { count: paths.length }
      );
    }
    return { success: true, deleted: paths.length };
  } catch (error) {
    console.error(`Failed to delete activity (${input.source}):`, error);
    return { success: false, deleted: 0, error: "No se pudo borrar" };
  }
}
