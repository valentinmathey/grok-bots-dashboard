"use client";

import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/Sheet";
import { useState } from "react";

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
  resultsCount,
  forceSheet = false,
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
  /** Si viene, "Ver resultados" muestra el número. */
  resultsCount?: number;
  /** Sheet también en desktop (Buscar). */
  forceSheet?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    startTransition(() => setOpen(false));
  }

  if (alwaysShow) {
    return (
      <div className="min-w-0 space-y-3">
        {primary}
        {children}
      </div>
    );
  }

  const resultsLabel =
    resultsCount == null
      ? "Ver resultados"
      : `Ver resultados (${resultsCount})`;

  const sheet = (
    <Sheet
      open={open}
      onClose={close}
      title={title}
      mobileOnly={!forceSheet}
      desktopDialog={forceSheet}
    >
      <div className="space-y-4">
        {children}
        <SheetFooter>
          {clearHref ? (
            <Link
              href={clearHref}
              scroll={false}
              prefetch
              onClick={close}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-4 text-sm font-medium transition-[transform,opacity] duration-150 active:scale-[0.97] touch-manipulation"
            >
              Limpiar
            </Link>
          ) : null}
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition-[transform,opacity] duration-150 active:scale-[0.97] touch-manipulation"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            {resultsLabel}
          </button>
        </SheetFooter>
      </div>
    </Sheet>
  );

  const filterButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={applied > 0 ? `${title}, ${applied} activos` : title}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-medium transition-[transform,opacity] duration-150 active:scale-[0.97] touch-manipulation ${
        primary || forceSheet ? "" : "w-full"
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
  );

  if (forceSheet) {
    return (
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {primary ? <div className="min-w-0 flex-1">{primary}</div> : null}
          {filterButton}
        </div>
        {activeChips?.length ? (
          <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
            {activeChips.map((chip, i) => (
              <Link
                key={i}
                href={chip.removeHref}
                scroll={false}
                prefetch
                className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full bg-accent/15 px-2.5 text-xs font-medium text-accent transition-[transform,opacity] duration-150 active:scale-[0.97]"
              >
                <span className="min-w-0 truncate">{chip.label}</span>
                <X size={12} strokeWidth={2} aria-label="Quitar" />
              </Link>
            ))}
          </div>
        ) : null}
        {sheet}
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
        {filterButton}
      </div>
      {activeChips?.length ? (
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 lg:hidden">
          {activeChips.map((chip, i) => (
            <Link
              key={i}
              href={chip.removeHref}
              scroll={false}
              prefetch
              className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full bg-accent/15 px-2.5 text-xs font-medium text-accent transition-[transform,opacity] duration-150 active:scale-[0.97]"
            >
              <span className="min-w-0 truncate">{chip.label}</span>
              <X size={12} strokeWidth={2} aria-label="Quitar" />
            </Link>
          ))}
        </div>
      ) : null}
      {sheet}
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
