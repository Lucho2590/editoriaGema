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

      {/* About Section */}
      <section id="quienes-somos" className="section bg-gema-cream scroll-mt-24">
        <div className="max-w-content mx-auto px-gutter">
          {/* Quiénes Somos */}
          <div className="max-w-prose mx-auto text-center mb-24 lg:mb-32">
            <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-4">
              Sobre nosotros
            </p>
            <h2 className="font-serif text-heading-xl text-gema-black mb-10 text-balance">
              ¿Quiénes somos?
            </h2>
            <div className="space-y-6 text-body-lg text-gema-gray-600 leading-relaxed">
              <p>
                GEMA es una editorial y espacio de formación dedicado a la producción y circulación
                de pensamiento crítico contemporáneo.
              </p>
              <p>
                Trabajamos con autores, investigadores y profesionales para transformar conocimiento
                académico en obras y experiencias accesibles, rigurosas y socialmente relevantes.
              </p>
              <p>
                Articulamos edición, curaduría y formación para construir puentes entre la
                universidad, la cultura y la sociedad.
              </p>
            </div>
          </div>

          {/* Misión + Visión */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 mb-24 lg:mb-32">
            <div>
              <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-4">
                Misión
              </p>
              <p className="text-body-lg text-gema-gray-700 leading-relaxed">
                Publicar, desarrollar y difundir obras y experiencias formativas, promoviendo el
                pensamiento crítico, el diálogo interdisciplinario y el acceso a conocimiento
                relevante para comprender y transformar la realidad.
              </p>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-4">
                Visión
              </p>
              <p className="text-body-lg text-gema-gray-700 leading-relaxed">
                Ser una editorial de referencia en el ámbito hispanohablante por su capacidad de
                articular producción académica rigurosa con formatos accesibles y experiencias
                formativas que amplíen el alcance del conocimiento.
              </p>
            </div>
          </div>

          {/* Propuesta de valor + Colecciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-4">
                Propuesta de valor
              </p>
              <p className="text-body text-gema-gray-700 mb-6 leading-relaxed">
                En GEMA no solo publicamos libros:
              </p>
              <ul className="space-y-3 text-body text-gema-gray-700">
                {[
                  "acompañamos procesos de escritura",
                  "convertimos investigación en contenido significativo",
                  "generamos espacios de formación vinculados a las obras",
                  "construimos comunidad en torno a ideas",
                ].map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span aria-hidden className="text-gema-gray-400 select-none">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-caption uppercase tracking-[0.15em] text-gema-gray-400 mb-4">
                Colecciones
              </p>
              <ul className="space-y-3 font-serif text-heading text-gema-black">
                {[
                  "Filosofía",
                  "Humanidades y Ciencias sociales",
                  "Género y diversidad",
                  "Ciencias del ambiente",
                  "Espacio GEMA",
                ].map((col) => (
                  <li key={col}>{col}</li>
                ))}
              </ul>
            </div>
          </div>
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
