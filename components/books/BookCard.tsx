"use client";

import Image from "next/image";
import Link from "next/link";
import { Book } from "@/types";

interface BookCardProps {
  book: Book;
  index?: number;
}

/**
 * Tres campos: tapa, título, autor. Nada más.
 *
 * Sin precio: es la decisión que más define si un catálogo se lee como
 * editorial o como góndola. De 15 sitios de editoriales relevados, los que
 * muestran precio en la grilla (Candaya, Hueders, Almadía, Lastarria) se leen
 * como tienda; los que no (Impedimenta, Sexto Piso, Fiordo, Caja Negra,
 * Ekaré, Entropía) se leen como catálogo. El precio vive en la ficha.
 *
 * Y la tapa va desnuda: sin marco, sin borde, sin sombra, sin fondo de card.
 * En eso coinciden los 15.
 */
export function BookCard({ book, index = 0 }: BookCardProps) {
  return (
    <article
      className="group animate-fade-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <Link href={`/libro/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] mb-5 overflow-hidden">
          <Image
            src={book.coverImage}
            alt={`Tapa de ${book.title}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <h3 className="font-display text-h4 text-ink group-hover:text-accent transition-colors duration-300 text-balance">
          {book.title}
        </h3>
        <p className="font-display italic text-meta text-ink-soft mt-1">
          {book.author}
        </p>
      </Link>
    </article>
  );
}
