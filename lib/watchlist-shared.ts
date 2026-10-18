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
