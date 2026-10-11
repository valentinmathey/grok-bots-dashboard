"use client";

import type { ReactNode } from "react";
import { EyeOff, Info } from "lucide-react";

export function StatCard({
  title,
  subtitle,
  info,
  loading = false,
  error = false,
  empty = false,
  emptyText = "No hay datos en este período.",
  onHide,
  children,
}: {
  title: string;
  subtitle?: string;
  info?: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyText?: string;
  onHide?: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="surface flex h-full min-h-0 flex-col rounded-3xl p-4">
      <header className="flex shrink-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">{title}</h2>
            {info ? (
              <span className="text-muted" title={info}>
                <Info size={14} strokeWidth={1.75} aria-label={info} />
              </span>
            ) : null}
          </div>
          {subtitle ? <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p> : null}
        </div>
        {onHide ? (
          <button
            type="button"
            onClick={onHide}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-chip"
            aria-label={`Ocultar ${title}`}
          >
            <EyeOff size={15} />
          </button>
        ) : null}
      </header>
      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-chip" />
      ) : error ? (
        <p className="mt-4 text-sm text-danger">No se pudo cargar este gráfico.</p>
      ) : empty ? (
        <p className="mt-4 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </section>
  );
}
