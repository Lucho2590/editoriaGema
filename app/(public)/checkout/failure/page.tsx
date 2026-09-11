import { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { getOrder } from "@/server/actions/orders";

export const metadata: Metadata = {
  title: "Pago no procesado",
  description: "Hubo un problema al procesar el pago.",
};

interface SearchParams {
  external_reference?: string;
  status?: string;
}

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.external_reference;
  const order = orderId ? await getOrder(orderId) : null;

  return (
    <div className="page-transition">
      <section className="section min-h-[60vh] flex items-center">
        <div className="max-w-readable mx-auto text-center">
          <div className="mb-8">
            <XCircle
              className="w-16 h-16 text-accent mx-auto"
              strokeWidth={1.5}
            />
          </div>

          <h1 className="font-display text-h2 text-ink mb-4">
            No pudimos procesar tu pago
          </h1>

          <p className="text-lede text-ink-soft mb-4">
            El pago fue rechazado o cancelado. Tu carrito sigue intacto si
            querés reintentar.
          </p>

          {order && (
            <p className="text-meta text-ink-soft mb-8">
              Orden #{order.id.slice(0, 8)}
            </p>
          )}

          <p className="text-lede text-ink-soft mb-12">
            Probá con otra tarjeta o medio de pago. Si el problema persiste,
            escribinos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/checkout"
              className="inline-block px-8 py-4 bg-ink text-paper text-meta tracking-wide hover:bg-paper-warm transition-colors duration-300"
            >
              Reintentar pago
            </Link>
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 border border-ink text-ink text-meta tracking-wide hover:bg-ink hover:text-paper transition-colors duration-300"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
