"use client";

import { useState } from "react";
import { useWatchlist } from "@/components/WatchlistProvider";
import { Eye, Plus, Trash2, TrendingDown, PackageCheck } from "lucide-react";
import {
  WATCHLIST_STATUSES,
  WATCHLIST_STATUS_LABELS,
  WATCHLIST_STATUS_STYLES,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/lib/watchlist-shared";

export type WatchRankingSummary = {
  post_id: string;
  best_price: number | null;
  best_store: string | null;
  currency: string;
  lowest_price: number | null;
  drop_pct: number | null;
  back_in_stock: boolean;
  checked_at: string | null;
};

const fmt = (n: number, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

export function WatchlistPanel({
  rankings,
}: {
  rankings: Record<string, WatchRankingSummary>;
}) {
  const ctx = useWatchlist();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [filter, setFilter] = useState<WatchlistStatus | "todos">("siguiendo");
  if (!ctx) return null;
  const { items, error, pending } = ctx;
  const patch = (id: string, change: Partial<WatchlistItem>) =>
    void ctx.patch(id, change);
  const remove = (id: string) => void ctx.remove(id);

  const shown = items.filter((i) => filter === "todos" || i.status === filter);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean || !ctx) return;
    const price = target.replace(/[^\d]/g, "");
    const item = await ctx.add({
      name: clean,
      target_price: price ? Number(price) : null,
    });
    if (item) {
      setName("");
      setTarget("");
      setFilter("siguiendo");
    }
  }

  const counts = Object.fromEntries(
    WATCHLIST_STATUSES.map((s) => [
      s,
      items.filter((i) => i.status === s).length,
    ]),
  ) as Record<WatchlistStatus, number>;

  return (
    <section className="surface min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Eye size={16} strokeWidth={1.75} className="text-accent" />
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Lista de seguimiento
        </h2>
      </div>

      <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Producto (ej. Logitech Z407)"
          maxLength={160}
          className="min-h-11 min-w-0 flex-[2_1_12rem] rounded-2xl border border-line bg-background px-3 text-base sm:text-sm"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          inputMode="numeric"
          placeholder="Precio objetivo (opcional)"
          className="min-h-11 min-w-0 flex-[1_1_9rem] rounded-2xl border border-line bg-background px-3 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={2} />
          Agregar
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["siguiendo", "comprado", "no-por-ahora", "todos"] as const).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`min-h-8 rounded-full px-3 text-xs font-medium ${
                  filter === s
                    ? "bg-accent text-white"
                    : "bg-foreground/5 text-muted"
                }`}
              >
                {s === "todos"
                  ? `Todos · ${items.length}`
                  : `${WATCHLIST_STATUS_LABELS[s]} · ${counts[s]}`}
              </button>
            ),
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Agregá productos y el bot los va a vigilar y avisarte cuando bajen.
        </p>
      )}

      <ul className="mt-3 divide-y divide-line">
        {shown.map((item) => {
          const r = rankings[item.id];
          const hit =
            r?.best_price != null &&
            item.target_price != null &&
            r.best_price <= item.target_price;
          return (
            <li key={item.id} className="py-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium leading-6">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">
                    {item.target_price != null
                      ? `Objetivo ${fmt(item.target_price)}`
                      : "Sin precio objetivo"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Borrar ${item.name}`}
                  onClick={() => remove(item.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:text-red-500"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>

              {r ? (
                <a
                  href={`#post-${r.post_id}`}
                  className="mt-2 block rounded-2xl bg-foreground/5 px-3 py-2 text-sm"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {r.best_price != null ? (
                      <span
                        className={`font-semibold ${hit ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                      >
                        {fmt(r.best_price, r.currency)}
                        {r.best_store ? (
                          <span className="font-normal text-muted">
                            {" "}
                            en {r.best_store}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    {hit ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Llegó al objetivo
                      </span>
                    ) : null}
                    {r.drop_pct ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        <TrendingDown size={12} /> Bajó {r.drop_pct}%
                      </span>
                    ) : null}
                    {r.back_in_stock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                        <PackageCheck size={12} /> Volvió el stock
                      </span>
                    ) : null}
                  </span>
                  {r.lowest_price != null ? (
                    <span className="mt-0.5 block text-xs text-muted">
                      Mínimo visto {fmt(r.lowest_price, r.currency)} · ver
                      ranking
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-xs text-muted">
                      Ver ranking
                    </span>
                  )}
                </a>
              ) : item.status === "siguiendo" ? (
                <p className="mt-1 text-xs text-muted">
                  El bot todavía no publicó el ranking.
                </p>
              ) : null}

              <div
                className="mt-2 flex flex-wrap gap-1.5"
                role="radiogroup"
                aria-label="Estado"
              >
                {WATCHLIST_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={item.status === s}
                    onClick={() =>
                      item.status !== s && patch(item.id, { status: s })
                    }
                    className={`min-h-8 rounded-full px-3 text-xs font-medium ${
                      item.status === s
                        ? WATCHLIST_STATUS_STYLES[s].chip
                        : "bg-foreground/5 text-muted"
                    }`}
                  >
                    {WATCHLIST_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
