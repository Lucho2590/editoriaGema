import Link from "next/link";
import Image from "next/image";
import { getBooks, getFeaturedBooks } from "@/server/actions/books";
import { BookGrid } from "@/components/books/BookGrid";
import { Hero } from "@/components/layout/Hero";
import { Book } from "@/types";

const COLECCIONES = [
  "Filosofía",
  "Humanidades y Ciencias sociales",
  "Género y diversidad",
  "Ciencias del ambiente",
  "Espacio GEMA",
];

const PROPUESTA = [
  "acompañamos procesos de escritura",
  "convertimos investigación en contenido significativo",
  "generamos espacios de formación vinculados a las obras",
  "construimos comunidad en torno a ideas",
];

export default async function HomePage() {
  const [allBooks, featured] = await Promise.all([
    getBooks(),
    getFeaturedBooks(),
  ]);

  // El destacado es el primer featured; si no hay ninguno marcado, el primero
  // del catálogo. Con pocos títulos publicados esto evita que la home quede
  // vacía y convierte la escasez en curaduría.
  const destacado: Book | undefined = featured[0] ?? allBooks[0];
  const resto = allBooks.filter((b) => b.id !== destacado?.id);

  return (
    <div className="page-transition">
      <Hero />

      {/* Destacado */}
      {destacado && (
        <section className="section-sm border-t border-rule">
          <div className="max-w-content mx-auto">
            <p className="eyebrow eyebrow-muted mb-10">Destacado</p>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
              <Link
                href={`/libro/${destacado.slug}`}
                className="md:col-span-5 lg:col-span-4 block group"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={destacado.coverImage}
                    alt={`Tapa de ${destacado.title}`}
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 30vw"
                  />
                </div>
              </Link>

              <div className="md:col-span-7 lg:col-span-7 md:pt-2">
                <h2 className="font-display text-h2 text-ink text-balance">
                  <Link
                    href={`/libro/${destacado.slug}`}
                    className="transition-colors duration-300 hover:text-accent"
                  >
                    {destacado.title}
                  </Link>
                </h2>
                <p className="font-display italic text-lede text-ink-soft mt-2">
                  {destacado.author}
                </p>
                <p className="text-prose text-ink-soft mt-6 line-clamp-5">
                  {destacado.description}
                </p>
                <Link
                  href={`/libro/${destacado.slug}`}
                  className="group mt-7 inline-flex items-center gap-2 border-b border-ink pb-1 text-meta text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
                >
                  Leer más
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Del catálogo — se oculta si el destacado es el único título */}
      {resto.length > 0 && (
        <section className="section-sm border-t border-rule">
          <div className="max-w-content mx-auto">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-10">
              <p className="eyebrow eyebrow-muted">Del catálogo</p>
              <Link
                href="/catalogo"
                className="group inline-flex items-center gap-2 text-meta text-ink-soft transition-colors duration-300 hover:text-accent"
              >
                Ver catálogo completo
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
            <BookGrid books={resto} columns={4} />
          </div>
        </section>
      )}

      {/* Propuesta de valor — el mejor copy que tienen, en posición de honor */}
      <section
        id="quienes-somos"
        className="section-sm border-t border-rule scroll-mt-24"
      >
        <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Quiénes somos</p>
          </div>
          <div className="md:col-span-8">
            <p className="font-display text-h2 text-ink text-balance">
              En GEMA no solo publicamos libros.
            </p>
            <ul className="mt-8 divide-y divide-rule border-t border-rule">
              {PROPUESTA.map((item) => (
                <li
                  key={item}
                  className="py-4 text-lede text-ink-soft first-letter:uppercase"
                >
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/manifiesto"
              className="group mt-8 inline-flex items-center gap-2 text-meta text-ink transition-colors duration-300 hover:text-accent"
            >
              Leer el manifiesto
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Colecciones — índice tipográfico. Todavía no filtran: Book no tiene
          campo de colección. Nombrarlas ya construye marca. */}
      <section className="section-sm border-t border-rule">
        <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Colecciones</p>
          </div>
          <ul className="md:col-span-8 divide-y divide-rule border-t border-rule">
            {COLECCIONES.map((col) => (
              <li key={col} className="py-4 font-display text-h3 text-ink">
                {col}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cierre — único momento de inversión cromática de la página */}
      <section className="section-sm bg-ink text-paper">
        <div className="max-w-content mx-auto">
          <h2 className="font-display text-h2 max-w-[16ch] text-balance">
            Libros en formato digital e impreso.
          </h2>
          <Link
            href="/catalogo"
            className="group mt-8 inline-flex items-center gap-2 border-b border-paper pb-1 text-meta text-paper transition-colors duration-300 hover:border-paper-muted hover:text-paper-muted"
          >
            Ver el catálogo
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
