"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Book, BookFormat, getBookPrice } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/hooks/useCart";
import { trackAddToCart } from "@/lib/analytics";
import { Check } from "lucide-react";

interface BookDetailProps {
  book: Book;
}

export function BookDetail({ book }: BookDetailProps) {
  const [selectedFormat, setSelectedFormat] = useState<BookFormat | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const availableFormats: { format: BookFormat; label: string; available: boolean; price: number }[] = [
    { format: "pdf", label: "PDF", available: book.formats.pdf, price: book.pricePdf },
    { format: "epub", label: "EPUB", available: book.formats.epub, price: book.priceEpub },
    { format: "print", label: "Impreso", available: book.formats.print && book.stockPrint > 0, price: book.pricePrint },
  ];

  const handleAddToCart = () => {
    if (!selectedFormat) return;

    addItem(book, selectedFormat);
    trackAddToCart(book.id, selectedFormat, getBookPrice(book, selectedFormat));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
      {/* Cover */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative aspect-[3/4] bg-gema-gray-50"
      >
        <Image
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col"
      >
        {/* Title & Author */}
        <div className="mb-8">
          <h1 className="font-serif text-display text-gema-black mb-4">
            {book.title}
          </h1>
          <p className="text-heading text-gema-gray-500">
            {book.author}
          </p>
        </div>

        {/* Year */}
        <p className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-8">
          {book.year}
        </p>

        {/* Description */}
        <div className="mb-12">
          <p className="text-body-lg text-gema-gray-600 leading-relaxed whitespace-pre-line">
            {book.description}
          </p>
        </div>

        {/* Format Selection */}
        <div className="mb-8">
          <h3 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-4">
            Formato
          </h3>
          <div className="flex flex-wrap gap-3">
            {availableFormats.map(({ format, label, available, price }) => (
              <button
                key={format}
                onClick={() => available && setSelectedFormat(format)}
                disabled={!available}
                className={`
                  px-6 py-3 border transition-all duration-300
                  ${
                    selectedFormat === format
                      ? "border-gema-black bg-gema-black text-gema-white"
                      : available
                      ? "border-gema-gray-200 text-gema-black hover:border-gema-black"
                      : "border-gema-gray-100 text-gema-gray-300 cursor-not-allowed"
                  }
                `}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <span className="text-display-lg font-serif text-gema-black">
              {formatCurrency(getBookPrice(book, selectedFormat))}
            </span>
          </motion.div>
        )}

        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={!selectedFormat}
          size="lg"
          className="w-full md:w-auto"
        >
          {added ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Agregado
            </>
          ) : (
            "Agregar al carrito"
          )}
        </Button>

        {/* Stock Notice */}
        {selectedFormat === "print" && book.stockPrint <= 5 && book.stockPrint > 0 && (
          <p className="mt-4 text-small text-gema-gray-500">
            Solo quedan {book.stockPrint} ejemplares
          </p>
        )}
      </motion.div>
    </div>
  );
}
