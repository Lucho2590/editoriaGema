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
}

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.external_reference;
  const order = orderId ? await getOrder(orderId) : null;

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
        <div className="max-w-prose mx-auto text-center">
          <div className="mb-8">
            <Clock className="w-16 h-16 text-amber-500 mx-auto" strokeWidth={1.5} />
          </div>

          <h1 className="font-serif text-heading-xl text-gema-black mb-4">Pago pendiente</h1>

          <p className="text-body-lg text-gema-gray-600 mb-4">
            Si elegiste pagar por Rapipago, transferencia o cualquier método offline, todavía
            estamos esperando la confirmación de MercadoPago.
          </p>

          {order && (
            <p className="text-small text-gema-gray-500 mb-4">
              Total: <span className="text-gema-black">{formatCurrency(order.total)}</span> · Orden
              #{order.id.slice(0, 8)}
            </p>
          )}

          <p className="text-body text-gema-gray-500 mb-12">
            Esta página se actualiza automáticamente cuando llega la confirmación. También recibirás
            un email cuando se acredite.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mi-biblioteca"
              className="inline-block px-8 py-4 border border-gema-black text-gema-black text-small tracking-wide hover:bg-gema-black hover:text-gema-white transition-colors duration-300"
            >
              Ir a mi biblioteca
            </Link>
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 border border-gema-black text-gema-black text-small tracking-wide hover:bg-gema-black hover:text-gema-white transition-colors duration-300"
            >
              Seguir explorando
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
