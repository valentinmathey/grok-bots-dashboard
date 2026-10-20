"use client";

import type { ReactNode } from "react";
import { ExpandChevron, ExpandableBody } from "@/components/ExpandableCard";

/** Bloque ámbar "Cambios" plegable (cambiados/cancelados fijados arriba). */
export function ChangesSection({
  count,
  open,
  onToggle,
  id,
  children,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  id: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="-my-1 flex min-h-11 w-full items-center gap-2 text-left"
      >
        <h2 className="flex-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
          Cambios
        </h2>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-semibold tabular-nums text-amber-700 dark:text-amber-400">
          {count}
        </span>
        <ExpandChevron open={open} compact />
      </button>
      <ExpandableBody open={open} id={id}>
        <div className="space-y-2 pt-2">{children}</div>
      </ExpandableBody>
    </section>
  );
}
