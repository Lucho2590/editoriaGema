"use client";

import Image from "next/image";
import Link from "next/link";
import { Book } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BookCardProps {
  book: Book;
  index?: number;
}

export function BookCard({ book, index = 0 }: BookCardProps) {
  // Get the lowest available price
  const prices = [
    book.formats.pdf && book.pricePdf,
    book.formats.epub && book.priceEpub,
    book.formats.print && book.pricePrint,
  ].filter(Boolean) as number[];

  const lowestPrice = Math.min(...prices);

  return (
    <article
      className="group animate-fade-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Link href={`/libro/${book.slug}`}>
        {/* Cover */}
        <div className="relative aspect-[3/4] mb-6 bg-gema-gray-50 overflow-hidden">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gema-black/0 group-hover:bg-gema-black/5 transition-colors duration-500" />
        </div>

        {/* Info */}
        <div className="space-y-2">
          <h3 className="font-serif text-heading text-gema-black group-hover:text-gema-gray-700 transition-colors duration-300">
            {book.title}
          </h3>

          <p className="text-small text-gema-gray-500">
            {book.author}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-body text-gema-black">
              {formatCurrency(lowestPrice)}
            </span>

            {/* Format indicators */}
            <div className="flex gap-2">
              {book.formats.pdf && (
                <span className="text-caption text-gema-gray-400 uppercase tracking-wider">
                  PDF
                </span>
              )}
              {book.formats.epub && (
                <span className="text-caption text-gema-gray-400 uppercase tracking-wider">
                  EPUB
                </span>
              )}
              {book.formats.print && (
                <span className="text-caption text-gema-gray-400 uppercase tracking-wider">
                  Impreso
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
