export const STAT_CARD_IDS = [
  "kpi",
  "posts-bot",
  "constancia",
  "actividad",
  "horario",
  "tipos",
  "tags",
  "insights",
  "comparativa",
] as const;

export type StatCardId = (typeof STAT_CARD_IDS)[number];

export type StatsLayout = {
  order: StatCardId[];
  hidden: StatCardId[];
};

export const DEFAULT_STATS_LAYOUT: StatsLayout = {
  order: [...STAT_CARD_IDS],
  hidden: [],
};

export const STATS_LAYOUT_KEY = "gb-stats-layout";

export const WIDE_CARD_IDS = ["kpi", "actividad", "comparativa"] as const;

export function isAlwaysWide(id: StatCardId): boolean {
  return (WIDE_CARD_IDS as readonly string[]).includes(id);
}

/** Half-width cards left alone in a 2-col row span full width. */
export function spanFullIds(
  visible: readonly StatCardId[],
  wideIds: readonly StatCardId[] = WIDE_CARD_IDS,
): Set<StatCardId> {
  const wide = new Set<string>(wideIds);
  const full = new Set<StatCardId>();
  let col = 0;
  for (let i = 0; i < visible.length; i += 1) {
    const id = visible[i]!;
    if (wide.has(id)) {
      col = 0;
      continue;
    }
    if (col === 1) {
      col = 0;
      continue;
    }
    const next = visible[i + 1];
    if (next == null || wide.has(next)) {
      full.add(id);
      col = 0;
    } else {
      col = 1;
    }
  }
  return full;
}

export function cardSpansFull(id: StatCardId, visible: readonly StatCardId[]): boolean {
  return isAlwaysWide(id) || spanFullIds(visible).has(id);
}

export function bubbleRadius(posts: number, maxPosts: number, min = 8, max = 26): number {
  if (maxPosts <= 0) return min;
  return Number((min + (Math.max(0, posts) / maxPosts) * (max - min)).toFixed(1));
}

export type StatsPeriod = 7 | 30 | 90 | 0;

export type StatsQuery = {
  days: StatsPeriod;
  bots: string[];
};

function asCardId(value: unknown): StatCardId | null {
  return typeof value === "string" && (STAT_CARD_IDS as readonly string[]).includes(value)
    ? (value as StatCardId)
    : null;
}

export function mergeStatsLayout(stored: unknown): StatsLayout {
  const raw =
    stored && typeof stored === "object" ? (stored as Partial<StatsLayout>) : {};
  const seen = new Set<StatCardId>();
  const order: StatCardId[] = [];
  for (const item of raw.order ?? []) {
    const id = asCardId(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  for (const id of STAT_CARD_IDS) {
    if (seen.has(id)) continue;
    seen.add(id);
    const defaultIndex = STAT_CARD_IDS.indexOf(id);
    let insertAt = order.length;
    let placed = false;
    for (let i = defaultIndex - 1; i >= 0; i -= 1) {
      const predPos = order.indexOf(STAT_CARD_IDS[i]!);
      if (predPos >= 0) {
        insertAt = predPos + 1;
        placed = true;
        break;
      }
    }
    if (!placed) {
      for (let i = defaultIndex + 1; i < STAT_CARD_IDS.length; i += 1) {
        const succPos = order.indexOf(STAT_CARD_IDS[i]!);
        if (succPos >= 0) {
          insertAt = succPos;
          break;
        }
      }
    }
    order.splice(insertAt, 0, id);
  }
  const hidden = [...new Set((raw.hidden ?? []).map(asCardId).filter(Boolean))] as StatCardId[];
  return { order, hidden };
}

export function parseStatsPeriod(value?: string): StatsPeriod {
  if (value === "7") return 7;
  if (value === "90") return 90;
  if (value === "all" || value === "0" || value === "todo") return 0;
  return 30;
}

export function parseStatsBots(value?: string, legacy?: string): string[] {
  const raw = value || legacy || "";
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function statsHref(query: StatsQuery, next: Partial<StatsQuery> = {}): string {
  const days = next.days ?? query.days;
  const bots = next.bots ?? query.bots;
  const params = new URLSearchParams();
  if (days === 7) params.set("days", "7");
  if (days === 90) params.set("days", "90");
  if (days === 0) params.set("days", "all");
  if (bots.length) params.set("bots", bots.join(","));
  const qs = params.toString();
  return qs ? `/estadisticas?${qs}` : "/estadisticas";
}

export function statsPeriodLabel(days: StatsPeriod): string {
  if (days === 7) return "últimos 7 días";
  if (days === 90) return "últimos 90 días";
  if (days === 0) return "todo el período";
  return "últimos 30 días";
}

export function statsSubtitle(
  bots: Array<{ slug: string; name: string }>,
  selected: string[],
  days: StatsPeriod,
): string {
  const period = statsPeriodLabel(days);
  if (selected.length === 1) {
    const name = bots.find((bot) => bot.slug === selected[0])?.name ?? selected[0];
    return `${name}, ${period}.`;
  }
  if (selected.length > 1) {
    return `${selected.length} bots, ${period}.`;
  }
  return `Actividad de los bots, ${period}.`;
}

export function movingAverage(values: number[], window = 7): number[] {
  return values.map((_, index) => {
    const from = Math.max(0, index - window + 1);
    const slice = values.slice(from, index + 1);
    return Number((slice.reduce((sum, n) => sum + n, 0) / slice.length).toFixed(2));
  });
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Number(value.toFixed(2));
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
