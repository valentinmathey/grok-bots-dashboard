import { todayYmd } from "@/lib/date-presets";
import { baCalendarDate } from "@/lib/event-time";
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
import { postAudio } from "@/lib/post-audio";
import type { Post } from "@/lib/types";
import { airlineKey, asVuelo, normalizeVueloCategoria, type VueloCategoria } from "@/lib/vuelos";

/** Presets de fecha de evento (hora Mendoza). */
export const SEARCH_DATE_PRESETS = [
  { id: "7", label: "Próximos 7 días", days: 7 },
  { id: "15", label: "Próximos 15 días", days: 15 },
  { id: "21", label: "Próximos 21 días", days: 21 },
  { id: "30", label: "1 mes", days: 30 },
] as const;

export type SearchDatePresetId = (typeof SEARCH_DATE_PRESETS)[number]["id"];

export const SEARCH_STATUS_FILTERS = ["activo", "cambiado", "cancelado"] as const;
export type SearchStatusFilter = (typeof SEARCH_STATUS_FILTERS)[number];

export const SEARCH_PRICE_FILTERS = ["gratis", "pago"] as const;
export type SearchPriceFilter = (typeof SEARCH_PRICE_FILTERS)[number];

export const SEARCH_KIND_GROUPS = [
  { id: "eventos", label: "Eventos", kinds: ["evento", "evento-mza", "gastro", "recital"] },
  { id: "productos", label: "Productos", kinds: ["ranking"] },
  { id: "noticias", label: "Noticias", kinds: ["newsletter"] },
  { id: "finanzas", label: "Finanzas", kinds: ["informe"] },
  { id: "alojamiento", label: "Alojamiento", kinds: ["alojamiento"] },
  { id: "oportunidades", label: "Oportunidades", kinds: ["oportunidades"] },
  { id: "vuelos", label: "Vuelos", kinds: ["vuelo"] },
] as const;

export type SearchKindGroupId = (typeof SEARCH_KIND_GROUPS)[number]["id"];

export type SearchUiFilters = {
  datePreset: SearchDatePresetId | null;
  from?: string;
  to?: string;
  importance: ImportanceLevel[];
  status: SearchStatusFilter[];
  price: SearchPriceFilter | null;
  age: MzaAgeFilter | null;
  buyBeforeSoon: boolean;
  registered: "si" | "no" | null;
  hasAudio: boolean;
  favoritesOnly: boolean;
  kindGroups: SearchKindGroupId[];
  bots: string[];
  aerolineas: string[];
  categorias: VueloCategoria[];
};

export const EMPTY_SEARCH_UI_FILTERS: SearchUiFilters = {
  datePreset: null,
  from: undefined,
  to: undefined,
  importance: [],
  status: [],
  price: null,
  age: null,
  buyBeforeSoon: false,
  registered: null,
  hasAudio: false,
  favoritesOnly: false,
  kindGroups: [],
  bots: [],
  aerolineas: [],
  categorias: [],
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

export function searchDatePresetRange(
  id: SearchDatePresetId,
  now: Date = new Date(),
): { from: string; to: string } {
  const today = todayYmd(now);
  const days = SEARCH_DATE_PRESETS.find((p) => p.id === id)?.days ?? 7;
  return { from: today, to: addDays(today, days - 1) };
}

export function matchingSearchDatePreset(
  range: { from?: string; to?: string },
  now: Date = new Date(),
): SearchDatePresetId | null {
  if (!range.from || !range.to) return null;
  for (const preset of SEARCH_DATE_PRESETS) {
    const r = searchDatePresetRange(preset.id, now);
    if (r.from === range.from && r.to === range.to) return preset.id;
  }
  return null;
}

function first(search: Record<string, string | string[] | undefined>, key: string) {
  const v = search[key];
  return Array.isArray(v) ? v[0] : v;
}

function isStatus(v: string): v is SearchStatusFilter {
  return (SEARCH_STATUS_FILTERS as readonly string[]).includes(v);
}

function isKindGroup(v: string): v is SearchKindGroupId {
  return SEARCH_KIND_GROUPS.some((g) => g.id === v);
}

export function parseSearchUiFilters(
  search: Record<string, string | string[] | undefined>,
): SearchUiFilters {
  const from = first(search, "from");
  const to = first(search, "to");
  const presetRaw = first(search, "cuando");
  let datePreset: SearchDatePresetId | null =
    presetRaw && SEARCH_DATE_PRESETS.some((p) => p.id === presetRaw)
      ? (presetRaw as SearchDatePresetId)
      : null;
  let fromY = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : undefined;
  let toY = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : undefined;
  if (datePreset && !fromY && !toY) {
    const r = searchDatePresetRange(datePreset);
    fromY = r.from;
    toY = r.to;
  } else if (!datePreset && fromY && toY) {
    datePreset = matchingSearchDatePreset({ from: fromY, to: toY });
  }

  const status = (first(search, "estado") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isStatus);
  const kindGroups = (first(search, "tipo") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isKindGroup);
  const bots = (first(search, "bot") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ageRaw = first(search, "edad");
  const age =
    ageRaw && (MZA_AGE_FILTERS as readonly string[]).includes(ageRaw)
      ? (ageRaw as MzaAgeFilter)
      : null;
  const priceRaw = first(search, "precio");
  const price =
    priceRaw === "gratis" || priceRaw === "pago" ? priceRaw : null;
  const regRaw = first(search, "inscripto");
  const registered = regRaw === "si" || regRaw === "no" ? regRaw : null;

  return {
    datePreset,
    from: fromY,
    to: toY,
    importance: parseImportanceList(first(search, "importance")) ?? [],
    status,
    price,
    age,
    buyBeforeSoon: first(search, "comprar") === "1",
    registered,
    hasAudio: first(search, "audio") === "1",
    favoritesOnly: first(search, "favorites") === "1",
    kindGroups,
    bots,
    aerolineas: (first(search, "aerolinea") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    categorias: (first(search, "categoria") ?? "")
      .split(",")
      .map((s) => s.trim())
      .map((s) => normalizeVueloCategoria(s) ?? s)
      .filter((s): s is VueloCategoria =>
        s === "mas-barato" || s === "equilibrado" || s === "mas-rapido",
      ),
  };
}

export function countSearchUiFilters(f: SearchUiFilters): number {
  return (
    Number(Boolean(f.datePreset || f.from || f.to)) +
    Number(f.importance.length > 0) +
    Number(f.status.length > 0) +
    Number(f.price !== null) +
    Number(f.age !== null) +
    Number(f.buyBeforeSoon) +
    Number(f.registered !== null) +
    Number(f.hasAudio) +
    Number(f.favoritesOnly) +
    Number(f.kindGroups.length > 0) +
    Number(f.bots.length > 0) +
    Number(f.aerolineas.length > 0) +
    Number(f.categorias.length > 0)
  );
}

export function searchUiHref(
  q: string,
  f: SearchUiFilters,
  patch: Partial<SearchUiFilters> = {},
  sort?: string,
): string {
  const next: SearchUiFilters = { ...f, ...patch };
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (sort && sort !== "relevance") params.set("sort", sort);
  if (next.datePreset) params.set("cuando", next.datePreset);
  // Si hay preset, no duplicamos from/to en la URL (se expanden al parsear).
  // Si el rango es custom, sí.
  if (!next.datePreset) {
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
  } else if (next.from && next.to) {
    const expected = searchDatePresetRange(next.datePreset);
    if (next.from !== expected.from || next.to !== expected.to) {
      params.delete("cuando");
      params.set("from", next.from);
      params.set("to", next.to);
    }
  }
  if (next.importance.length) params.set("importance", next.importance.join(","));
  if (next.status.length) params.set("estado", next.status.join(","));
  if (next.price) params.set("precio", next.price);
  if (next.age) params.set("edad", next.age);
  if (next.buyBeforeSoon) params.set("comprar", "1");
  if (next.registered) params.set("inscripto", next.registered);
  if (next.hasAudio) params.set("audio", "1");
  if (next.favoritesOnly) params.set("favorites", "1");
  if (next.kindGroups.length) params.set("tipo", next.kindGroups.join(","));
  if (next.bots.length) params.set("bot", next.bots.join(","));
  if (next.aerolineas.length) params.set("aerolinea", next.aerolineas.join(","));
  if (next.categorias.length) params.set("categoria", next.categorias.join(","));
  const s = params.toString();
  return s ? `/buscar?${s}` : "/buscar";
}

function priceOf(d: Record<string, unknown>): "gratis" | "pago" | null {
  if (typeof d.price_from === "number") return d.price_from === 0 ? "gratis" : "pago";
  if (typeof d.price_text === "string" && /gratis|libre|free|sin cargo/i.test(d.price_text)) {
    return "gratis";
  }
  if (typeof d.price_text === "string" && d.price_text.trim()) return "pago";
  return null;
}

function statusOf(d: Record<string, unknown>): string {
  return String(d.status ?? "activo");
}

export function kindsForGroups(groups: SearchKindGroupId[]): string[] {
  const kinds = new Set<string>();
  for (const id of groups) {
    const group = SEARCH_KIND_GROUPS.find((g) => g.id === id);
    group?.kinds.forEach((k) => kinds.add(k));
  }
  return [...kinds];
}

export type SearchMatchContext = {
  favoriteIds?: Set<string>;
  registeredIds?: Set<string>;
  now?: Date;
};

/** ¿El post pasa los filtros de UI de Buscar? (además del texto q). */
export function matchesSearchUiFilters(
  post: Post & { bot?: { slug?: string; id?: string } },
  f: SearchUiFilters,
  ctx: SearchMatchContext = {},
): boolean {
  const d = (post.details ?? {}) as Record<string, unknown>;
  const now = ctx.now ?? new Date();
  const today = todayYmd(now);

  if (f.bots.length) {
    const slug = post.bot?.slug;
    const id = post.bot?.id;
    if (!slug && !id) return false;
    if (!f.bots.includes(slug ?? "") && !f.bots.includes(id ?? "")) return false;
  }

  if (f.kindGroups.length) {
    const allowed = kindsForGroups(f.kindGroups);
    if (!allowed.includes(post.kind)) return false;
  }

  if (f.aerolineas.length || f.categorias.length) {
    if (post.kind !== "vuelo") return false;
    const details = asVuelo(post.details);
    if (!details) return false;
    if (f.aerolineas.length && !f.aerolineas.includes(airlineKey(details))) return false;
    if (f.categorias.length && (!details.categoria || !f.categorias.includes(details.categoria))) {
      return false;
    }
  }

  if (f.importance.length && !matchesImportance(d, f.importance)) return false;

  if (f.status.length) {
    const st = statusOf(d);
    // Posts sin status tipado (no eventos) se tratan como "activo".
    if (!f.status.includes(st as SearchStatusFilter)) return false;
  }

  if (f.price) {
    const p = priceOf(d);
    if (p !== f.price) return false;
  }

  if (f.age && !matchesMzaAge(d, f.age)) return false;

  if (f.buyBeforeSoon) {
    const bb = typeof d.buy_before === "string" ? d.buy_before : null;
    if (!bb || !/^\d{4}-\d{2}-\d{2}$/.test(bb) || bb < today) return false;
  }

  if (f.hasAudio && !postAudio(post)) return false;

  if (f.favoritesOnly) {
    if (!ctx.favoriteIds?.has(post.id)) return false;
  }

  if (f.registered === "si" && !ctx.registeredIds?.has(post.id)) return false;
  if (f.registered === "no" && ctx.registeredIds?.has(post.id)) return false;

  const hasDateFilter = Boolean(f.datePreset || f.from || f.to);
  if (hasDateFilter) {
    if (!post.event_at) return false;
    const day = baCalendarDate(post.event_at);
    let from = f.from;
    let to = f.to;
    if (f.datePreset && !from && !to) {
      const r = searchDatePresetRange(f.datePreset, now);
      from = r.from;
      to = r.to;
    }
    if (from && day < from) return false;
    if (to && day > to) return false;
  }

  return true;
}

export function searchUiHasAdvanced(f: SearchUiFilters): boolean {
  return countSearchUiFilters(f) > 0;
}

export { IMPORTANCE_FILTER_LEVELS, MZA_AGE_FILTERS };
