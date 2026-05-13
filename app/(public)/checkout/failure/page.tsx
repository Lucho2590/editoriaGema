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
        <div className="max-w-prose mx-auto text-center">
          <div className="mb-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" strokeWidth={1.5} />
          </div>

          <h1 className="font-serif text-heading-xl text-gema-black mb-4">
            No pudimos procesar tu pago
          </h1>

          <p className="text-body-lg text-gema-gray-600 mb-4">
            El pago fue rechazado o cancelado. Tu carrito sigue intacto si querés reintentar.
          </p>

          {order && (
            <p className="text-small text-gema-gray-500 mb-8">Orden #{order.id.slice(0, 8)}</p>
          )}

          <p className="text-body text-gema-gray-500 mb-12">
            Probá con otra tarjeta o medio de pago. Si el problema persiste, escribinos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/checkout"
              className="inline-block px-8 py-4 bg-gema-black text-gema-white text-small tracking-wide hover:bg-gema-gray-800 transition-colors duration-300"
            >
              Reintentar pago
            </Link>
            <Link
              href="/catalogo"
              className="inline-block px-8 py-4 border border-gema-black text-gema-black text-small tracking-wide hover:bg-gema-black hover:text-gema-white transition-colors duration-300"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
