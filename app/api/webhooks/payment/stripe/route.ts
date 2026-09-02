import { NextRequest, NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/payments";
import { updateOrderPayment } from "@/lib/orders/fulfillment";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const event = verifyStripeWebhook(payload, signature);

  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await updateOrderPayment(orderId, session.id, "completed");
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await updateOrderPayment(orderId, session.id, "failed");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        // Handle failed payment if needed
        console.log("Payment failed:", paymentIntent.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
