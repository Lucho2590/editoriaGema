/**
 * Audit log vocabulary. Shared by the server (writing) and the admin UI
 * (labels and filters), so it must stay free of server-only imports.
 */
export const AUDIT_ACTIONS = {
  "order.transfer_confirmed": "Transferencia aprobada",
  "order.transfer_rejected": "Transferencia rechazada",
  "order.downloads_resent": "Libros reenviados",
  "order.deleted": "Pedido borrado",
  "book.created": "Libro creado",
  "book.updated": "Libro editado",
  "book.deleted": "Libro borrado",
  "admin.invited": "Administrador invitado",
  "admin.invitation_resent": "Invitación reenviada",
  "admin.removed": "Administrador quitado",
  "settings.mercadopago_updated": "MercadoPago: credenciales guardadas",
  "settings.mercadopago_mode_changed": "MercadoPago: modo cambiado",
  "settings.mercadopago_cleared": "MercadoPago: credenciales borradas",
  "settings.mercadopago_disconnected": "MercadoPago desconectado",
  "settings.transfer_updated": "Transferencia: datos guardados",
  "settings.notifications_updated": "Notificaciones guardadas",
  "activity.visitors_deleted": "Acciones de visitantes borradas",
  "activity.mercadopago_deleted": "Avisos de MercadoPago borrados",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export type AuditTargetType = "order" | "book" | "user" | "settings" | "activity";

export interface AuditTarget {
  type: AuditTargetType;
  id: string;
  /** Human-readable reference, e.g. "#9IWDLI" or a book title */
  label?: string;
}

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: { uid: string; email: string | null };
  target: AuditTarget;
  details?: Record<string, unknown>;
  /** ISO string */
  createdAt: string;
}

/** Tabs of the Auditoría section: every kind of record the site keeps */
export const ACTIVITY_SOURCES = {
  orders: "Pedidos",
  visitors: "Visitantes",
  mercadopago: "MercadoPago",
  admin: "Admins",
} as const;

export type ActivitySource = keyof typeof ACTIVITY_SOURCES;

export interface ActivityRow {
  /** Firestore document path, used to delete it */
  path: string;
  /** ISO string */
  date: string;
  title: string;
  subtitle?: string;
  details?: Record<string, unknown>;
}
