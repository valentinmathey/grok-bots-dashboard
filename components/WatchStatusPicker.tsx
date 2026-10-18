"use client";

import { useState } from "react";
import { Check, CircleDot } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { useWatchlist } from "@/components/WatchlistProvider";
import {
  WATCHLIST_STATUSES,
  WATCHLIST_STATUS_LABELS,
  WATCHLIST_STATUS_STYLES,
  type WatchlistStatus,
} from "@/lib/watchlist-shared";

/** Ítem de la lista de seguimiento vinculado a un ranking (null si no hay lista en esta página). */
export function useWatchItem(productName: string, sourceId?: string) {
  const ctx = useWatchlist();
  const item = ctx?.findFor(sourceId, productName);
  async function pick(status: WatchlistStatus) {
    if (!ctx) return;
    if (item) {
      if (item.status !== status) await ctx.patch(item.id, { status });
      return;
    }
    await ctx.add({ name: productName, status });
  }
  return { enabled: Boolean(ctx), item, pick };
}

const DESCRIPTIONS: Record<WatchlistStatus, string> = {
  siguiendo: "El bot lo sigue y te avisa si baja",
  comprado: "Ya está, deja de buscarlo",
  "no-por-ahora": "Lo pausa hasta que lo vuelvas a seguir",
};

/** Botón de acciones de la card: muestra el estado con un color y abre un selector. */
export function WatchStatusButton({
  productName,
  sourceId,
}: {
  productName: string;
  sourceId?: string;
}) {
  const { enabled, item, pick } = useWatchItem(productName, sourceId);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!enabled) return null;
  const status = item?.status;
  const label = status
    ? `Estado: ${WATCHLIST_STATUS_LABELS[status]}. Tocá para cambiarlo`
    : "Marcar estado";

  return (
    <div onClick={(e) => e.stopPropagation()} data-no-collapse>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full text-muted transition-transform hover:scale-110 hover:text-foreground"
      >
        {status ? (
          <span
            className={`grid h-[18px] w-[18px] place-items-center rounded-full ${WATCHLIST_STATUS_STYLES[status].dot}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        ) : (
          <CircleDot size={17} strokeWidth={1.75} />
        )}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Estado del producto"
        desktopDialog
      >
        <p className="mb-3 break-words text-sm text-muted">{productName}</p>
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="Estado del producto"
        >
          {WATCHLIST_STATUSES.map((s) => {
            const on = status === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await pick(s);
                  setBusy(false);
                  setOpen(false);
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors disabled:opacity-60 ${
                  on
                    ? "border-transparent " + WATCHLIST_STATUS_STYLES[s].soft
                    : "border-line hover:bg-chip"
                }`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${WATCHLIST_STATUS_STYLES[s].dot}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {WATCHLIST_STATUS_LABELS[s]}
                  </span>
                  <span className="block text-xs text-muted">
                    {DESCRIPTIONS[s]}
                  </span>
                </span>
                {on ? <Check size={16} strokeWidth={2} /> : null}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

/** Chip con el estado actual (para el meta de la card). */
export function WatchStatusBadge({
  productName,
  sourceId,
}: {
  productName: string;
  sourceId?: string;
}) {
  const { item } = useWatchItem(productName, sourceId);
  if (!item) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${WATCHLIST_STATUS_STYLES[item.status].soft}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${WATCHLIST_STATUS_STYLES[item.status].dot}`}
      />
      {WATCHLIST_STATUS_LABELS[item.status]}
    </span>
  );
}
