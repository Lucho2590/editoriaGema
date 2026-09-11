"use client";

import { cn } from "@/lib/utils";
import { Book } from "@/types";

export type FormatFilter = "all" | "digital" | "print";

export const FORMAT_FILTERS: { id: FormatFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "digital", label: "Digital" },
  { id: "print", label: "Impreso" },
];

/**
 * Filtra por el formato en el que la obra está publicada, no por stock:
 * un título impreso agotado sigue siendo un título impreso del catálogo.
 * La disponibilidad se resuelve en la ficha.
 */
export function matchesFormat(book: Book, filter: FormatFilter): boolean {
  if (filter === "all") return true;
  if (filter === "digital") return book.formats.pdf || book.formats.epub;
  return book.formats.print;
}

interface CatalogFiltersProps {
  value: FormatFilter;
  onChange: (value: FormatFilter) => void;
}

export function CatalogFilters({ value, onChange }: CatalogFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      <span id="filtro-formato" className="eyebrow eyebrow-muted">
        Formato
      </span>
      <div role="group" aria-labelledby="filtro-formato" className="flex gap-4">
        {FORMAT_FILTERS.map((format) => (
          <button
            key={format.id}
            type="button"
            onClick={() => onChange(format.id)}
            aria-pressed={value === format.id}
            className={cn(
              "text-meta transition-colors duration-300",
              value === format.id
                ? "text-ink underline underline-offset-[6px] decoration-accent decoration-1"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
}
