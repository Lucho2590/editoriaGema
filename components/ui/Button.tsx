"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-sans tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gema-black text-gema-white hover:bg-gema-gray-800 active:bg-gema-gray-900",
      secondary:
        "bg-transparent text-gema-black border border-gema-black hover:bg-gema-black hover:text-gema-white",
      ghost:
        "bg-transparent text-gema-gray-600 hover:text-gema-black",
    };

    const sizes = {
      sm: "text-caption px-4 py-2",
      md: "text-small px-6 py-3",
      lg: "text-body px-8 py-4",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
