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
    <div className="flex items-center gap-3 p-3 bg-paper-warm border border-rule">
      <div className="flex-1 min-w-0">
        <p className="text-meta uppercase tracking-wider text-ink-soft">
          {label}
        </p>
        <p className="text-lede text-ink truncate" title={value}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="p-2 text-ink-soft hover:text-ink transition-colors shrink-0"
        aria-label={`Copiar ${label}`}
      >
        {copied ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <Copy size={16} />
        )}
      </button>
    </div>
  );
}
