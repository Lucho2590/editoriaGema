"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const formats = [
  { id: "all", label: "Todos" },
  { id: "digital", label: "Digital" },
  { id: "print", label: "Impreso" },
];

export function CatalogFilters() {
  const [activeFormat, setActiveFormat] = useState("all");

  return (
    <div className="flex flex-wrap items-center gap-6">
      <span className="text-caption uppercase tracking-[0.1em] text-gema-gray-400">
        Formato
      </span>
      <div className="flex gap-4">
        {formats.map((format) => (
          <button
            key={format.id}
            onClick={() => setActiveFormat(format.id)}
            className={cn(
              "text-small tracking-wide transition-colors duration-300",
              activeFormat === format.id
                ? "text-gema-black"
                : "text-gema-gray-400 hover:text-gema-gray-600"
            )}
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
}
