"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Book, BookFormat, getBookPrice } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/hooks/useCart";
import { trackAddToCart } from "@/lib/analytics";
import { Check, ShoppingBag } from "lucide-react";

interface BookDetailProps {
  book: Book;
}

/**
 * Orden: tapa → título → autor → metadatos mínimos → SINOPSIS → formato →
 * precio → comprar.
 *
 * La sinopsis va antes que el precio a propósito: es la jerarquía literaria,
 * no la comercial. Almadía hace lo contrario (género BISAC, ISBN, EAN, páginas
 * y fecha antes del texto) y es su peor decisión de ficha.
 */
export function BookDetail({ book }: BookDetailProps) {
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | null>(null);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableFormats: {
    format: BookFormat;
    label: string;
    available: boolean;
    price: number;
  }[] = [
    {
      format: "pdf",
      label: "PDF",
      available: book.formats.pdf,
      price: book.pricePdf,
    },
    {
      format: "epub",
      label: "EPUB",
      available: book.formats.epub,
      price: book.priceEpub,
    },
    {
      format: "print",
      label: "Impreso",
      available: book.formats.print && book.stockPrint > 0,
      price: book.pricePrint,
    },
  ];

  const handleAddToCart = () => {
    if (!selectedFormat) return;
    addItem(book, selectedFormat);
    trackAddToCart(book.id, selectedFormat, getBookPrice(book, selectedFormat));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      {/* Tapa — desnuda, sin marco */}
      <div className="lg:col-span-5">
        <div className="relative aspect-[7/10] w-full max-w-sm mx-auto lg:mx-0 lg:max-w-none animate-slide-in">
          <Image
            src={book.coverImage}
            quality={90}
            alt={`Tapa de ${book.title}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 80vw, 40vw"
          />
        </div>
      </div>

      <div
        className="lg:col-span-7 animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h1 className="font-display text-hero text-ink text-balance">
          {book.title}
        </h1>

        <p className="font-display italic text-h3 text-ink-soft mt-3">
          {book.author}
        </p>

        {/* Metadatos mínimos: es lo que hay sin tocar el modelo de datos.
            Faltan ISBN, páginas, medidas, colección, traductor y prologuista. */}
        <p className="eyebrow eyebrow-muted mt-6">{book.year}</p>

        <p className="text-prose text-ink-soft mt-8 whitespace-pre-line">
          {book.description}
        </p>

        {/* Compra — después del texto */}
        <div className="mt-12 pt-8 border-t border-rule">
          <p className="eyebrow eyebrow-muted mb-4">Formato</p>
          <div className="flex flex-wrap gap-3">
            {availableFormats.map(({ format, label, available, price }) => (
              <button
                type="button"
                key={format}
                onClick={() => available && setSelectedFormat(format)}
                disabled={!available}
                aria-pressed={selectedFormat === format}
                className={cn(
                  "px-5 py-3 border text-meta transition-colors duration-300",
                  selectedFormat === format
                    ? "border-ink bg-ink text-paper"
                    : available
                      ? "border-rule text-ink hover:border-ink"
                      : "border-rule text-ink-soft/50 cursor-not-allowed",
                )}
              >
                {label}
                {available ? (
                  <span className="ml-3 text-ink-soft/80">
                    {formatCurrency(price)}
                  </span>
                ) : (
                  <span className="ml-3">Agotado</span>
                )}
              </button>
            ))}
          </div>

          {selectedFormat && (
            <p className="animate-fade-in mt-8 font-display text-h2 text-ink">
              {formatCurrency(getBookPrice(book, selectedFormat))}
            </p>
          )}

          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedFormat || !mounted}
            size="lg"
            className="mt-6 w-full sm:w-auto"
          >
            {added ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Agregar al carrito
              </>
            )}
          </Button>

          {selectedFormat === "print" &&
            book.stockPrint <= 5 &&
            book.stockPrint > 0 && (
              <p className="mt-4 text-meta text-accent">
                Solo quedan {book.stockPrint} ejemplares
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
