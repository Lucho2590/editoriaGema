import { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Completa tu compra en GEMA Editorial.",
};

export default function CheckoutPage() {
  return (
    <div className="page-transition">
      <section className="section">
        <div className="max-w-content mx-auto">
          <CheckoutForm />
        </div>
      </section>
    </div>
  );
}
