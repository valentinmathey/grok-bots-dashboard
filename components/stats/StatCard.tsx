"use client";

import type { ReactNode } from "react";
import { ChevronDown, EyeOff, Info } from "lucide-react";

export function StatCard({
  title,
  subtitle,
  info,
  loading = false,
  error = false,
  empty = false,
  emptyText = "No hay datos en este período.",
  collapsed = false,
  onToggleCollapse,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="surface flex h-full min-h-0 flex-col rounded-3xl p-4">
      <header className="flex items-start gap-2">
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
        <div className="flex shrink-0 items-center gap-1">
          {onHide ? (
            <button
              type="button"
              onClick={onHide}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-chip"
              aria-label={`Ocultar ${title}`}
            >
              <EyeOff size={15} />
            </button>
          ) : null}
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-chip"
              aria-expanded={!collapsed}
              aria-label={collapsed ? `Mostrar ${title}` : `Plegar ${title}`}
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
              />
            </button>
          ) : null}
        </div>
      </header>
      {collapsed ? null : loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-chip" />
      ) : error ? (
        <p className="mt-4 text-sm text-danger">No se pudo cargar este gráfico.</p>
      ) : empty ? (
        <p className="mt-4 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className="mt-3 min-h-0 flex-1">{children}</div>
      )}
    </section>
  );
}
