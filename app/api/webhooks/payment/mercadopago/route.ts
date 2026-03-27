import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/payments";
import { updateOrderPayment } from "@/server/actions/orders";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // MercadoPago sends different types of notifications
    if (body.type === "payment") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
      }

      // Get payment details from MercadoPago
      const payment = await getMercadoPagoPayment(paymentId.toString());

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      const orderId = payment.external_reference;

      if (!orderId) {
        return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
      }

      // Map MercadoPago status to our status
      let status: "pending" | "processing" | "completed" | "failed" | "refunded";

      switch (payment.status) {
        case "approved":
          status = "completed";
          break;
        case "pending":
        case "in_process":
        case "authorized":
          status = "processing";
          break;
        case "rejected":
        case "cancelled":
          status = "failed";
          break;
        case "refunded":
          status = "refunded";
          break;
        default:
          status = "pending";
      }

      await updateOrderPayment(orderId, paymentId.toString(), status);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
