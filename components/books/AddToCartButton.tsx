"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag } from "lucide-react";
import { Book, BookFormat, getBookPrice } from "@/types";
import { useCartStore } from "@/hooks/useCart";
import { trackAddToCart } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";

interface AddToCartButtonProps {
  book: Book;
  format: BookFormat;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AddToCartButton({ book, format, size = "md", className }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleClick = () => {
    addItem(book, format);
    trackAddToCart(book.id, format, getBookPrice(book, format));

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button onClick={handleClick} size={size} className={className}>
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            Agregado
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Agregar
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
