import { Metadata } from "next";
import { getBooks } from "@/server/actions/books";
import { BookGrid } from "@/components/books/BookGrid";
import { CatalogFilters } from "@/components/books/CatalogFilters";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora nuestra colección de libros de pensamiento contemporáneo, humanidades y ciencias sociales.",
};

export default async function CatalogoPage() {
  const books = await getBooks();

  return (
    <div className="page-transition">
      {/* Header */}
      <section className="section-sm border-b border-gema-gray-100">
        <div className="max-w-content mx-auto">
          <h1 className="font-serif text-display text-gema-black mb-4">
            Catálogo
          </h1>
          <p className="text-body-lg text-gema-gray-500 max-w-xl">
            Explora nuestra colección de títulos en formato digital e impreso.
          </p>
        </div>
      </section>

      {/* Filters & Grid */}
      <section className="section">
        <div className="max-w-content mx-auto">
          <CatalogFilters />
          <div className="mt-12">
            <BookGrid books={books} columns={3} />
          </div>
        </div>
      </section>
    </div>
  );
}
