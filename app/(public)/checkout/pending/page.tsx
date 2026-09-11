import { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getOrder } from "@/server/actions/orders";
import { OrderStatusListener } from "@/components/checkout/OrderStatusListener";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pago pendiente",
  description: "Estamos esperando la confirmación de tu pago.",
};

interface SearchParams {
  external_reference?: string;
  status?: string;
  method?: string;
}

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.external_reference;
  const order = orderId ? await getOrder(orderId) : null;
  const isTransfer =
    params.method === "transfer" || order?.paymentProvider === "transfer";

  return (
    <div className="page-transition">
      {order && (
        <OrderStatusListener
          orderId={order.id}
          initialStatus={order.paymentStatus}
          clearCartWhenCompleted
        />
      )}
      <section className="section min-h-[60vh] flex items-center">
        <div className="max-w-readable mx-auto text-center">
          <div className="mb-8">
            <Clock
              className="w-16 h-16 text-amber-500 mx-auto"
              strokeWidth={1.5}
            />
          </div>

          <h1 className="font-display text-h2 text-ink mb-4">
            {isTransfer
              ? "Estamos verificando tu transferencia"
              : "Pago pendiente"}
          </h1>

          <p className="text-lede text-ink-soft mb-4">
            {isTransfer
              ? "Recibimos tus datos. En cuanto confirmemos la acreditación bancaria vas a recibir un email."
              : "Si elegiste pagar por Rapipago, transferencia o cualquier método offline, todavía estamos esperando la confirmación de MercadoPago."}
          </p>

          {order && (
            <p className="text-meta text-ink-soft mb-4">
              Total:{" "}
              <span className="text-ink">{formatCurrency(order.total)}</span> ·
              Orden #{order.id.slice(0, 8)}
            </p>
          )}

          <p className="text-lede text-ink-soft mb-12">
            Esta página se actualiza automáticamente cuando llega la
            confirmación. También recibirás un email cuando se acredite.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 border border-ink text-ink text-meta tracking-wide hover:bg-ink hover:text-paper transition-colors duration-300"
            >
              Seguir explorando
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
