"use client";

import { useState } from "react";
import { useWatchlist } from "@/components/WatchlistProvider";
import {
  WATCHLIST_STATUSES,
  WATCHLIST_STATUS_LABELS,
  type WatchlistStatus,
} from "@/lib/watchlist-shared";

const ACTIVE: Record<WatchlistStatus, string> = {
  siguiendo: "bg-accent text-accent-ink",
  comprado: "bg-emerald-500 text-white",
  "no-por-ahora": "bg-foreground/70 text-background",
};

/** Selector de 3 estados para un producto. Si el ranking no tiene ítem en la lista, lo crea al tocar. */
export function WatchStatusPicker({
  productName,
  sourceId,
  className = "",
}: {
  productName: string;
  sourceId?: string;
  className?: string;
}) {
  const ctx = useWatchlist();
  const [busy, setBusy] = useState(false);
  if (!ctx) return null;
  const item = ctx.findFor(sourceId, productName);

  async function pick(status: WatchlistStatus) {
    if (!ctx || busy) return;
    if (item) {
      if (item.status !== status) await ctx.patch(item.id, { status });
      return;
    }
    setBusy(true);
    await ctx.add({ name: productName, status });
    setBusy(false);
  }

  return (
    <div
      data-no-collapse
      onClick={(e) => e.stopPropagation()}
      className={`flex flex-wrap gap-1.5 ${className}`}
      role="radiogroup"
      aria-label="Estado del producto"
    >
      {WATCHLIST_STATUSES.map((s) => {
        const on = item?.status === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              void pick(s);
            }}
            className={`min-h-8 rounded-full px-3 text-xs font-medium transition-colors disabled:opacity-60 ${
              on ? ACTIVE[s] : "bg-chip text-muted hover:text-foreground"
            }`}
          >
            {WATCHLIST_STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
