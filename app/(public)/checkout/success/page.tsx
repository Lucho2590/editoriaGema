import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getOrder } from "@/server/actions/orders";
import { OrderStatusListener } from "@/components/checkout/OrderStatusListener";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Estado del pago",
  description: "Confirmación de tu compra.",
};

interface SearchParams {
  external_reference?: string;
  payment_id?: string;
  status?: string;
  collection_status?: string;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.external_reference;

  if (!orderId) {
    return <MissingOrderFallback />;
  }

  const order = await getOrder(orderId);
  if (!order) {
    return <MissingOrderFallback />;
  }

  const variant = pickVariant(order.paymentStatus);

  return (
    <div className="page-transition">
      <OrderStatusListener
        orderId={order.id}
        initialStatus={order.paymentStatus}
        clearCartWhenCompleted
      />
      <section className="section min-h-[60vh] flex items-center">
        <div className="max-w-prose mx-auto text-center">
          <div className="mb-8">
            <variant.Icon className={`w-16 h-16 ${variant.iconClass} mx-auto`} strokeWidth={1.5} />
          </div>

          <h1 className="font-serif text-heading-xl text-gema-black mb-4">{variant.title}</h1>

          <p className="text-body-lg text-gema-gray-600 mb-4">{variant.message}</p>

          <p className="text-small text-gema-gray-500 mb-8">
            Total: <span className="text-gema-black">{formatCurrency(order.total)}</span> · Orden #
            {order.id.slice(0, 8)}
          </p>

          {variant.showLibraryCta && order.hasDigitalItems && (
            <p className="text-body text-gema-gray-500 mb-12">
              Si compraste libros digitales, recibirás un email separado con los enlaces de descarga
              en los próximos minutos.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

function pickVariant(status: string) {
  if (status === "completed") {
    return {
      Icon: CheckCircle,
      iconClass: "text-green-600",
      title: "¡Gracias por tu compra!",
      message: "Tu pedido fue procesado correctamente. Recibirás un email de confirmación.",
      showLibraryCta: true,
    };
  }
  if (status === "processing" || status === "pending") {
    return {
      Icon: Clock,
      iconClass: "text-amber-500",
      title: "Tu pago está en revisión",
      message:
        "Estamos esperando la confirmación de MercadoPago. En cuanto se acredite te llegará un email — esta página se actualiza automáticamente.",
      showLibraryCta: false,
    };
  }
  return {
    Icon: AlertCircle,
    iconClass: "text-red-500",
    title: "No pudimos procesar tu pago",
    message: "Si pensás que esto es un error, escribinos y lo revisamos.",
    showLibraryCta: false,
  };
}

function MissingOrderFallback() {
  return (
    <div className="page-transition">
      <section className="section min-h-[60vh] flex items-center">
        <div className="max-w-prose mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-gema-gray-400 mx-auto mb-8" strokeWidth={1.5} />
          <h1 className="font-serif text-heading-xl text-gema-black mb-4">
            No encontramos tu orden
          </h1>
          <p className="text-body-lg text-gema-gray-600 mb-8">
            Si pagaste con MercadoPago, revisá tu email — te enviamos la confirmación apenas se
            acredite el pago.
          </p>
          <Link
            href="/catalogo"
            className="inline-block px-8 py-4 border border-gema-black text-gema-black text-small tracking-wide hover:bg-gema-black hover:text-gema-white transition-colors duration-300"
          >
            Volver al catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
