"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Campo de una línea, solo lectura, con botón de copiar a la derecha. */
export function CopyField({
  value,
  label = "Copiar link",
  className = "",
}: {
  value: string;
  /** aria-label del botón. */
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin permiso de portapapeles: el valor se puede seleccionar a mano */
    }
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-1 rounded-xl border border-line bg-raised py-1 pl-3 pr-1 ${className}`}
    >
      <input
        type="text"
        readOnly
        value={value}
        aria-label={label.replace(/^Copiar/, "").trim() || "Valor"}
        onFocus={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1 truncate bg-transparent font-mono text-base sm:text-xs text-foreground outline-none"
      />
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Copiado" : label}
        title={label}
        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-chip hover:text-foreground"
      >
        {copied ? <Check size={15} strokeWidth={2} className="text-emerald-500" /> : <Copy size={15} strokeWidth={1.75} />}
        {copied ? <span className="text-emerald-600 dark:text-emerald-400">Copiado</span> : null}
      </button>
    </div>
  );
}
