import Link from "next/link";
import { getFeaturedBooks } from "@/server/actions/books";
import { BookGrid } from "@/components/books/BookGrid";
import { Hero } from "@/components/layout/Hero";

export default async function HomePage() {
  const featuredBooks = await getFeaturedBooks();

  return (
    <div className="page-transition">
      {/* Hero */}
      <Hero />

      {/* Manifesto Section */}
      <section className="section bg-gema-cream">
        <div className="max-w-prose mx-auto text-center">
          <h2 className="font-serif text-heading-xl text-gema-black mb-8 text-balance">
            Pensamiento que resuena
          </h2>
          <p className="text-body-lg text-gema-gray-600 leading-relaxed mb-8">
            GEMA nace como espacio de resonancia para las ideas que cuestionan, transforman y
            reimaginan nuestro presente. Publicamos ensayos, manifiestos y reflexiones que
            atraviesan las humanidades, las ciencias sociales y el arte contemporáneo.
          </p>
          <Link
            href="/manifiesto"
            className="inline-block text-small tracking-wide text-gema-black border-b border-gema-black pb-1 hover:text-gema-gray-600 hover:border-gema-gray-600 transition-colors duration-300"
          >
            Leer nuestro manifiesto
          </Link>
        </div>
      </section>

      {/* Featured Publications */}
      <section className="section">
        <div className="max-w-content mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-3">
                Publicaciones
              </p>
              <h2 className="font-serif text-heading-xl text-gema-black">
                Destacados
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-small tracking-wide text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
            >
              Ver todo →
            </Link>
          </div>

          <BookGrid books={featuredBooks} columns={3} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gema-black text-gema-white">
        <div className="max-w-prose mx-auto text-center">
          <h2 className="font-serif text-heading-xl mb-6">
            Explora el catálogo
          </h2>
          <p className="text-body-lg text-gema-gray-300 mb-10">
            Descubre nuestra colección de títulos en formato digital e impreso.
          </p>
          <Link
            href="/catalogo"
            className="inline-block px-8 py-4 bg-gema-white text-gema-black text-small tracking-wide hover:bg-gema-gray-100 transition-colors duration-300"
          >
            Ver catálogo completo
          </Link>
        </div>
      </section>
    </div>
  );
}
