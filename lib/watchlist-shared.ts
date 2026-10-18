export const WATCHLIST_STATUSES = [
  "siguiendo",
  "comprado",
  "no-por-ahora",
] as const;
export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  siguiendo: "Siguiendo",
  comprado: "Ya lo compré",
  "no-por-ahora": "No por ahora",
};

/** Colores por estado: chip activo, punto, borde de la tarjeta. */
export const WATCHLIST_STATUS_STYLES: Record<
  WatchlistStatus,
  { chip: string; dot: string; ring: string; soft: string }
> = {
  siguiendo: {
    chip: "bg-sky-500 text-white",
    dot: "bg-sky-500",
    ring: "ring-2 ring-sky-500/80",
    soft: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  comprado: {
    chip: "bg-emerald-500 text-white",
    dot: "bg-emerald-500",
    ring: "ring-2 ring-emerald-500/80",
    soft: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  "no-por-ahora": {
    chip: "bg-amber-500 text-white",
    dot: "bg-amber-500",
    ring: "ring-2 ring-amber-500/80",
    soft: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
};

export type WatchlistItem = {
  id: string;
  bot_id: string;
  name: string;
  target_price: number | null;
  status: WatchlistStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Vincula un ítem con su ranking: por source_id `watch:<id>` o, si no, por nombre parecido. */
export function matchesWatchItem(
  item: Pick<WatchlistItem, "id" | "name">,
  sourceId: unknown,
  productName: unknown,
) {
  if (sourceId === `watch:${item.id}`) return true;
  if (typeof productName !== "string") return false;
  const a = norm(item.name);
  const b = norm(productName);
  return Boolean(a) && (a === b || b.includes(a) || a.includes(b));
}
