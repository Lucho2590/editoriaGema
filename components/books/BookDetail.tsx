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

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-2">
    {children}
  </p>
);

export function BookDetail({ book }: BookDetailProps) {
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | null>(null);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableFormats: { format: BookFormat; label: string; available: boolean; price: number }[] = [
    { format: "pdf", label: "PDF", available: book.formats.pdf, price: book.pricePdf },
    { format: "epub", label: "EPUB", available: book.formats.epub, price: book.priceEpub },
    { format: "print", label: "Impreso", available: book.formats.print && book.stockPrint > 0, price: book.pricePrint },
  ];

  const handleAddToCart = () => {
    if (!selectedFormat) return;

    console.log("Adding to cart:", book.title, selectedFormat);
    addItem(book, selectedFormat);

    // Track analytics (async, non-blocking)
    trackAddToCart(book.id, selectedFormat, getBookPrice(book, selectedFormat));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      {/* Cover */}
      <div className="lg:col-span-5">
        <div className="relative w-full max-h-[600px] aspect-[3/4] bg-gema-gray-50 animate-slide-in mx-auto lg:mx-0 lg:max-w-md">
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </div>
      </div>

      {/* Details */}
      <div className="lg:col-span-7 flex flex-col animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-serif text-display text-gema-black">
            {book.title}
          </h1>
        </div>

        {/* Author */}
        <div className="mb-8">
          <FieldLabel>Autor</FieldLabel>
          <p className="text-body-lg text-gema-gray-700">
            {book.author}
          </p>
        </div>

        {/* Year */}
        <div className="mb-8">
          <FieldLabel>Año de publicación</FieldLabel>
          <p className="text-body text-gema-gray-700">
            {book.year}
          </p>
        </div>

        {/* Description */}
        <div className="mb-12">
          <FieldLabel>Sinopsis</FieldLabel>
          <p className="text-body-lg text-gema-gray-600 leading-relaxed whitespace-pre-line">
            {book.description}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-8">
          <FieldLabel>Formato</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {availableFormats.map(({ format, label, available, price }) => (
              <button
                type="button"
                key={format}
                onClick={() => available && setSelectedFormat(format)}
                disabled={!available}
                className={cn(
                  "px-6 py-3 border transition-all duration-300",
                  selectedFormat === format
                    ? "border-gema-black bg-gema-black text-gema-white"
                    : available
                    ? "border-gema-gray-200 text-gema-black hover:border-gema-black"
                    : "border-gema-gray-100 text-gema-gray-300 cursor-not-allowed"
                )}
              >
                <span className="text-small">{label}</span>
                {available && (
                  <span className="ml-3 text-caption">
                    {formatCurrency(price)}
                  </span>
                )}
                {!available && (
                  <span className="ml-3 text-caption">Agotado</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price Display */}
        {selectedFormat && (
          <div className="mb-8 animate-fade-in">
            <FieldLabel>Precio</FieldLabel>
            <span className="text-display-lg font-serif text-gema-black">
              {formatCurrency(getBookPrice(book, selectedFormat))}
            </span>
          </div>
        )}

        {/* Add to Cart */}
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedFormat || !mounted}
          size="lg"
          className="w-full md:w-auto"
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

        {/* Stock Notice */}
        {selectedFormat === "print" && book.stockPrint <= 5 && book.stockPrint > 0 && (
          <p className="mt-4 text-small text-gema-gray-500">
            Solo quedan {book.stockPrint} ejemplares
          </p>
        )}
      </div>
    </div>
  );
}
