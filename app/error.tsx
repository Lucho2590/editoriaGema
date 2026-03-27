"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-gutter">
      <div className="text-center">
        <h1 className="font-serif text-heading-xl text-gema-black mb-4">
          Algo salió mal
        </h1>
        <p className="text-body-lg text-gema-gray-500 mb-8">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <Button onClick={reset}>Intentar de nuevo</Button>
      </div>
    </div>
  );
}
