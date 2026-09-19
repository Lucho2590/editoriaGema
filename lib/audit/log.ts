/**
 * Writes to the audit log (Firestore `audit_logs`, server-only).
 *
 * Deliberately NOT a server action, so it can't be called from the browser to
 * forge entries. Admin actions call it after their own authorization check.
 */
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import type { SessionUser } from "@/lib/auth/session";
import type { AuditAction, AuditTarget } from "@/lib/audit/actions";

export const AUDIT_COLLECTION = "audit_logs";

/**
 * Never throws: failing to audit must not undo or block the action itself.
 */
export async function logAudit(
  actor: SessionUser,
  action: AuditAction,
  target: AuditTarget,
  details?: Record<string, unknown>
): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection(AUDIT_COLLECTION).add({
      action,
      actor: { uid: actor.uid, email: actor.email },
      target: { type: target.type, id: target.id, ...(target.label && { label: target.label }) },
      ...(details && { details: stripUndefined(details) }),
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Failed to write audit log (${action}):`, error);
  }
}

/** Short order reference used across the admin, e.g. "#9IWDLI" */
export function orderLabel(orderId: string): string {
  return `#${orderId.slice(-6).toUpperCase()}`;
}

// Firestore rejects `undefined` values
function stripUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value));
}
