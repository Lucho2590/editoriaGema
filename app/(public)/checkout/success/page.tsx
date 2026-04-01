import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Compra exitosa",
  description: "Tu compra ha sido procesada correctamente.",
};

export default function CheckoutSuccessPage() {
  return (
    <div className="page-transition">
      <section className="section min-h-[60vh] flex items-center">
        <div className="max-w-prose mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" strokeWidth={1.5} />
          </div>

          <h1 className="font-serif text-heading-xl text-gema-black mb-4">
            ¡Gracias por tu compra!
          </h1>

          <p className="text-body-lg text-gema-gray-600 mb-8">
            Tu pedido ha sido procesado correctamente. Recibirás un email de confirmación
            con los detalles de tu compra.
          </p>

          <p className="text-body text-gema-gray-500 mb-12">
            Si compraste libros digitales, recibirás un email separado con los enlaces
            de descarga en los próximos minutos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mi-biblioteca"
              className="inline-block px-8 py-4 bg-gema-black text-gema-white text-small tracking-wide hover:bg-gema-gray-800 transition-colors duration-300"
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
