import { Metadata } from "next";
import { getBooks } from "@/server/actions/books";
import { CatalogBrowser } from "@/components/books/CatalogBrowser";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora nuestra colección de libros de pensamiento contemporáneo, humanidades y ciencias sociales.",
};

export default async function CatalogoPage() {
  const books = await getBooks();

  return (
    <div className="page-transition">
      {/* Header */}
      <section className="section-sm pt-16 md:pt-20 pb-10">
        <div className="max-w-content mx-auto">
          <p className="eyebrow">Catálogo</p>
          <h1 className="font-display text-hero text-ink mt-5 max-w-[16ch] text-balance">
            Todos los títulos
          </h1>
          <p className="text-lede text-ink-soft mt-5 max-w-[46ch]">
            Explora nuestra colección de títulos en formato digital e impreso.
          </p>
        </div>
      </section>

      {/* Filters & Grid */}
      <section className="section-sm pt-0">
        <div className="max-w-content mx-auto">
          <CatalogBrowser books={books} />
        </div>
      </section>
    </div>
  );
}
