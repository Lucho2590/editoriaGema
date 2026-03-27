"use client";

import { Book } from "@/types";
import { BookCard } from "./BookCard";

interface BookGridProps {
  books: Book[];
  columns?: 2 | 3 | 4;
}

export function BookGrid({ books, columns = 3 }: BookGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-section">
        <p className="text-body-lg text-gema-gray-500">
          No hay libros disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-x-8 gap-y-16`}>
      {books.map((book, index) => (
        <BookCard key={book.id} book={book} index={index} />
      ))}
    </div>
  );
}
