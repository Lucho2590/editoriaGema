"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/manifiesto", label: "Manifiesto" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gema-white/90 backdrop-blur-sm">
      <nav className="max-w-content mx-auto px-gutter py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group">
          <span className="font-serif text-heading tracking-[0.15em] text-gema-black">
            GEMA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-small tracking-wide text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Cart & Mobile Menu */}
        <div className="flex items-center gap-6">
          <Link
            href="/checkout"
            className="relative text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gema-black text-gema-white text-[10px] flex items-center justify-center rounded-full animate-in zoom-in duration-200">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden border-t border-gema-gray-100 bg-gema-white overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="max-w-content mx-auto px-gutter py-8 flex flex-col gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-body tracking-wide text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
