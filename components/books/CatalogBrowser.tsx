"use client";

import { useMemo, useState } from "react";
import { Book } from "@/types";
import { BookGrid } from "./BookGrid";
import { CatalogFilters, FormatFilter, matchesFormat } from "./CatalogFilters";

/**
 * Dueño del estado del filtro.
 *
 * Antes CatalogFilters y BookGrid eran hermanos sin nada en común: el filtro
 * guardaba su selección en un useState propio y la grilla nunca se enteraba.
 * Se veía activo y no filtraba nada.
 */
export function CatalogBrowser({ books }: { books: Book[] }) {
  const [format, setFormat] = useState<FormatFilter>("all");

  const visibles = useMemo(
    () => books.filter((book) => matchesFormat(book, format)),
    [books, format],
  );

  return (
    <>
      <div className="border-y border-rule py-5">
        <CatalogFilters value={format} onChange={setFormat} />
      </div>

      <div className="mt-12">
        {visibles.length > 0 ? (
          <BookGrid books={visibles} columns={4} />
        ) : (
          <div className="py-section-sm">
            <p className="text-lede text-ink-soft">
              {format === "print"
                ? "Todavía no hay títulos en formato impreso."
                : "Todavía no hay títulos en formato digital."}
            </p>
            <button
              type="button"
              onClick={() => setFormat("all")}
              className="mt-4 text-meta text-ink underline underline-offset-4 decoration-accent transition-colors duration-300 hover:text-accent"
            >
              Ver todo el catálogo
            </button>
          </div>
        )}
      </div>
    </>
  );
}
