"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet } from "@/components/Sheet";

export type ActiveFilterChip = { label: ReactNode; removeHref: string };

/**
 * Patrón único de filtros: en desktop (lg+) los chips van inline; en mobile
 * una fila compacta con el control principal + botón "Filtros" (badge) que
 * abre un bottom sheet con todos los grupos, Limpiar y Ver resultados.
 */
export function FilterToolbar({
  children,
  applied = 0,
  title = "Filtros",
  alwaysShow = false,
  primary,
  clearHref,
  activeChips,
}: {
  children: ReactNode;
  applied?: number;
  title?: string;
  alwaysShow?: boolean;
  /** Control principal (ej. Ordenar por) que queda visible en mobile. */
  primary?: ReactNode;
  /** Link para limpiar todos los filtros del sheet. */
  clearHref?: string;
  /** Chips chicos removibles bajo la fila (solo mobile). */
  activeChips?: ActiveFilterChip[];
}) {
  const [open, setOpen] = useState(false);
  if (alwaysShow) {
    return (
      <div className="min-w-0 space-y-3">
        {primary}
        {children}
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <div className="hidden min-w-0 space-y-3 lg:block">
        {primary}
        {children}
      </div>
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        {primary ? <div className="min-w-0 flex-1">{primary}</div> : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={applied > 0 ? `${title}, ${applied} activos` : title}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-medium ${
            primary ? "" : "w-full"
          }`}
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          {title}
          {applied > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {applied}
            </span>
          ) : null}
        </button>
      </div>
      {activeChips?.length ? (
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 lg:hidden">
          {activeChips.map((chip, i) => (
            <Link
              key={i}
              href={chip.removeHref}
              scroll={false}
              className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full bg-accent/15 px-2.5 text-xs font-medium text-accent"
            >
              <span className="min-w-0 truncate">{chip.label}</span>
              <X size={12} strokeWidth={2} aria-label="Quitar" />
            </Link>
          ))}
        </div>
      ) : null}
      <Sheet open={open} onClose={() => setOpen(false)} title={title} mobileOnly>
        <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
          {children}
          <div className="sticky bottom-0 flex gap-2 border-t border-line bg-background pt-3">
            {clearHref ? (
              <Link
                href={clearHref}
                scroll={false}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-4 text-sm font-medium"
              >
                Limpiar
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
            >
              Ver resultados
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/** Título de grupo dentro del sheet/inline. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {children}
    </div>
  );
}
