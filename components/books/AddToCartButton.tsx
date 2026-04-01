"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Book, BookFormat, getBookPrice } from "@/types";
import { useCartStore } from "@/hooks/useCart";
import { trackAddToCart } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
    <Button onClick={handleClick} size={size} className={cn("relative overflow-hidden", className)}>
      <span
        className={cn(
          "flex items-center transition-all duration-300",
          added ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        )}
      >
        <ShoppingBag className="w-4 h-4 mr-2" />
        Agregar
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          added ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}
      >
        <Check className="w-4 h-4 mr-2" />
        Agregado
      </span>
    </Button>
  );
}
