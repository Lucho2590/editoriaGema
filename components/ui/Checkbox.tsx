"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 border border-gema-gray-300 bg-transparent",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gema-black",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-gema-black data-[state=checked]:border-gema-black data-[state=checked]:text-gema-white",
        "transition-colors duration-200",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="size-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
