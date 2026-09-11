"use client";

import { Book } from "@/types";
import { BookCard } from "./BookCard";

interface BookGridProps {
  books: Book[];
  columns?: 2 | 3 | 4;
}

export function BookGrid({ books, columns = 3 }: BookGridProps) {
  // 2 columnas ya en móvil: la tapa es el contenido, y a una sola columna la
  // grilla se lee como una lista de productos en vez de como un catálogo.
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  if (books.length === 0) {
    return (
      <div className="py-section-sm">
        <p className="text-lede text-ink-soft">
          No hay libros disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-x-6 gap-y-12 md:gap-x-8`}>
      {books.map((book, index) => (
        <BookCard key={book.id} book={book} index={index} />
      ))}
    </div>
  );
}
