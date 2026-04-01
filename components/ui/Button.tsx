"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-black text-white hover:bg-gema-gray-600 active:bg-gema-gray-600",
        secondary:
          "bg-transparent text-gema-black border border-gema-black hover:bg-gema-black hover:text-white",
        ghost: "bg-transparent text-gema-white hover:text-gema-white hover:bg-gema-gray-600/10",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        link: "text-white underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-caption",
        md: "h-11 px-6 text-small",
        lg: "h-13 px-8 text-body",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
