import { baCalendarDate } from "@/lib/event-time";
import { todayYmd } from "@/lib/date-presets";
import {
  IMPORTANCE_FILTER_LEVELS,
  matchesImportance,
  parseImportanceList,
  type ImportanceLevel,
} from "@/lib/importance";
import {
  MZA_AGE_FILTERS,
  matchesMzaAge,
  type MzaAgeFilter,
} from "@/lib/mendoza";
import type { Bot, Post } from "@/lib/types";

export const EVENT_BOT_SLUGS = [
  "eventos-tech-mdz",
  "fiestas-mendoza",
  "gastronomia-mendoza",
  "recitales-mendoza",
] as const;

export type EventBotSlug = (typeof EVENT_BOT_SLUGS)[number];

export const EVENT_BOT_LABELS: Record<EventBotSlug, string> = {
  "eventos-tech-mdz": "Eventos tech",
  "fiestas-mendoza": "Fiestas",
  "gastronomia-mendoza": "Gastronomía",
  "recitales-mendoza": "Recitales",
};

export const EVENT_KINDS = ["evento", "evento-mza", "gastro", "recital"] as const;

export const EVENTOS_DATE_PRESETS = [
  { id: "hoy", label: "Hoy" },
  { id: "finde", label: "Finde" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
] as const;

export type EventosDatePreset = (typeof EVENTOS_DATE_PRESETS)[number]["id"];

export type EventosSort = "fecha" | "importancia" | "bot";

export type EventosFilters = {
  bots: string[];
  from?: string;
  to?: string;
  importance: ImportanceLevel[];
  changedOnly: boolean;
  age: MzaAgeFilter | null;
  sort: EventosSort;
};

export const EMPTY_EVENTOS_FILTERS: EventosFilters = {
  bots: [],
  from: undefined,
  to: undefined,
  importance: [],
  changedOnly: false,
  age: null,
  sort: "fecha",
};

export type EventosItem = Post & {
  bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
};

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(ymd: string, days: number): string {
  const date = parseYmd(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return toYmd(date);
}

/** Sábado–domingo del finde actual o próximo (calendario AR). */
export function findeRange(now: Date = new Date()): { from: string; to: string } {
  const today = todayYmd(now);
  const dow = (parseYmd(today).getUTCDay() + 6) % 7; // 0=lun … 5=sáb 6=dom
  if (dow === 5) return { from: today, to: addDays(today, 1) };
  if (dow === 6) return { from: addDays(today, -1), to: today };
  const from = addDays(today, 5 - dow);
  return { from, to: addDays(from, 1) };
}

export function eventosPresetRange(
  id: EventosDatePreset,
  now: Date = new Date(),
): { from: string; to: string } {
  const today = todayYmd(now);
  switch (id) {
    case "hoy":
      return { from: today, to: today };
    case "finde":
      return findeRange(now);
    case "semana": {
      const weekday = (parseYmd(today).getUTCDay() + 6) % 7;
      const from = addDays(today, -weekday);
      return { from, to: addDays(from, 6) };
    }
    case "mes": {
      const date = parseYmd(today);
      const from = toYmd(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
      const to = toYmd(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
      return { from, to };
    }
  }
}

export function matchingEventosPreset(
  range: { from?: string; to?: string },
  now: Date = new Date(),
): EventosDatePreset | null {
  if (!range.from || !range.to) return null;
  for (const preset of EVENTOS_DATE_PRESETS) {
    const r = eventosPresetRange(preset.id, now);
    if (r.from === range.from && r.to === range.to) return preset.id;
  }
  return null;
}

export function isEventBotSlug(value: string): value is EventBotSlug {
  return (EVENT_BOT_SLUGS as readonly string[]).includes(value);
}

export function parseEventosFilters(
  search: Record<string, string | string[] | undefined>,
): EventosFilters {
  const first = (key: string) => {
    const v = search[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const botsRaw = (first("bot") ?? first("bots") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isEventBotSlug);
  const from = first("from");
  const to = first("to");
  const ageRaw = first("edad");
  const age =
    ageRaw && (MZA_AGE_FILTERS as readonly string[]).includes(ageRaw)
      ? (ageRaw as MzaAgeFilter)
      : null;
  const sortRaw = first("sort");
  const sort: EventosSort =
    sortRaw === "importancia" || sortRaw === "bot" ? sortRaw : "fecha";
  return {
    bots: botsRaw,
    from: from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : undefined,
    to: to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : undefined,
    importance: parseImportanceList(first("importance")) ?? [],
    changedOnly: first("cambiados") === "1" || first("cambiados") === "si",
    age,
    sort,
  };
}

export function countEventosFilters(f: EventosFilters): number {
  return (
    Number(f.bots.length > 0) +
    Number(Boolean(f.from || f.to)) +
    Number(f.importance.length > 0) +
    Number(f.changedOnly) +
    Number(f.age !== null)
  );
}

export function eventosHref(f: EventosFilters, patch: Partial<EventosFilters> = {}): string {
  const next: EventosFilters = { ...f, ...patch };
  const q = new URLSearchParams();
  if (next.bots.length) q.set("bot", next.bots.join(","));
  if (next.from) q.set("from", next.from);
  if (next.to) q.set("to", next.to);
  if (next.importance.length) q.set("importance", next.importance.join(","));
  if (next.changedOnly) q.set("cambiados", "1");
  if (next.age) q.set("edad", next.age);
  if (next.sort !== "fecha") q.set("sort", next.sort);
  const s = q.toString();
  return s ? `/eventos?${s}` : "/eventos";
}

function statusOf(post: Post): string {
  return String((post.details as Record<string, unknown> | null)?.status ?? "activo");
}

export function isChangedStatus(post: Post): boolean {
  const s = statusOf(post);
  return s === "cambiado" || s === "cancelado";
}

export function matchesEventosFilters(item: EventosItem, f: EventosFilters): boolean {
  if (f.bots.length && !f.bots.includes(item.bot.slug)) return false;
  if (f.importance.length && !matchesImportance(item.details as Record<string, unknown>, f.importance)) {
    return false;
  }
  if (f.changedOnly && !isChangedStatus(item)) return false;
  if (f.age && !matchesMzaAge((item.details ?? {}) as Record<string, unknown>, f.age)) {
    return false;
  }
  if (f.from || f.to) {
    if (!item.event_at) return false;
    const day = baCalendarDate(item.event_at);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
  }
  return true;
}

const IMPORTANCE_RANK: Record<string, number> = {
  imperdible: 0,
  destacado: 1,
  bueno: 2,
  normal: 3,
};

export function sortEventosItems(items: EventosItem[], sort: EventosSort): EventosItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "bot") {
      const byBot = a.bot.name.localeCompare(b.bot.name, "es");
      if (byBot) return byBot;
    }
    if (sort === "importancia") {
      const ra =
        IMPORTANCE_RANK[String((a.details as Record<string, unknown> | null)?.importance ?? "normal")] ?? 9;
      const rb =
        IMPORTANCE_RANK[String((b.details as Record<string, unknown> | null)?.importance ?? "normal")] ?? 9;
      if (ra !== rb) return ra - rb;
    }
    return (a.event_at ?? "").localeCompare(b.event_at ?? "");
  });
  return copy;
}

export function filterAndSortEventos(items: EventosItem[], f: EventosFilters): EventosItem[] {
  return sortEventosItems(items.filter((item) => matchesEventosFilters(item, f)), f.sort);
}

export { IMPORTANCE_FILTER_LEVELS };
