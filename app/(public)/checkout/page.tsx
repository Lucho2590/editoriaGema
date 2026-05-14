import { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getTransferSettings } from "@/server/actions/settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Completa tu compra en GEMA Editorial.",
};

// Settings cambian desde el panel de admin: pedimos render dinámico para que
// la página refleje el último estado (transfer enabled, descuento, etc.).
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const transfer = await getTransferSettings();
  const transferEnabled = Boolean(transfer?.enabled);
  const transferDiscountPercentage = transfer?.discountPercentage ?? 0;

  return (
    <div className="page-transition">
      <section className="section">
        <div className="max-w-content mx-auto">
          <CheckoutForm
            transferEnabled={transferEnabled}
            transferDiscountPercentage={transferDiscountPercentage}
          />
        </div>
      </section>
    </div>
  );
}
