"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BaseInputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, BaseInputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    if (label || error) {
      return (
        <div className="w-full">
          {label && (
            <label
              htmlFor={id}
              className="block text-caption uppercase tracking-[0.1em] text-gema-gray-500 mb-2"
            >
              {label}
            </label>
          )}
          <input
            type={type}
            id={id}
            ref={ref}
            data-slot="input"
            className={cn(
              "flex h-11 w-full border border-gema-gray-200 bg-transparent px-4 py-3 text-body text-gema-black",
              "placeholder:text-gema-gray-400",
              "focus:outline-none focus:border-gema-black focus:ring-1 focus:ring-gema-black/10",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-300",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            {...props}
          />
          {error && <p className="mt-1 text-caption text-red-500">{error}</p>}
        </div>
      );
    }

    return (
      <input
        type={type}
        id={id}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-11 w-full border border-gema-gray-200 bg-transparent px-4 py-3 text-body text-gema-black",
          "placeholder:text-gema-gray-400",
          "focus:outline-none focus:border-gema-black focus:ring-1 focus:ring-gema-black/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-300",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
