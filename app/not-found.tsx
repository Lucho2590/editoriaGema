import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-gutter">
      <div className="text-center">
        <h1 className="font-serif text-display-lg text-gema-black mb-4">404</h1>
        <p className="text-body-lg text-gema-gray-500 mb-8">
          La página que buscas no existe.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-gema-black text-gema-white text-small tracking-wide hover:bg-gema-gray-800 transition-colors duration-300"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
