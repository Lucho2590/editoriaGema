"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  label: string;
  value: string;
  copyValue?: string;
}

export function CopyableField({ label, value, copyValue }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gema-gray-50 border border-gema-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-caption uppercase tracking-wider text-gema-gray-500">
          {label}
        </p>
        <p className="text-body text-gema-black truncate" title={value}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="p-2 text-gema-gray-500 hover:text-gema-black transition-colors shrink-0"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
      </button>
    </div>
  );
}
