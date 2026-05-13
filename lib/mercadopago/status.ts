import type { PaymentStatus } from "@/types";

export type MPPaymentStatus =
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "pending"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | string;

export function mapMercadoPagoStatus(mpStatus: MPPaymentStatus | undefined | null): PaymentStatus {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "completed";
    case "rejected":
    case "cancelled":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "in_process":
    case "in_mediation":
    case "pending":
      return "processing";
    default:
      return "pending";
  }
}
