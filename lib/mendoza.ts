import { z } from "zod";
import { baCalendarDate } from "@/lib/event-time";
import type { Post } from "@/lib/types";

/**
 * Kinds de los bots de Mendoza: Fiestas Mendoza (evento-mza), gastronomía (gastro) y
 * recitales (recital). Schemas zod de details + helpers puros de la "agenda viva".
 */

export const MZA_KINDS = ["evento-mza", "gastro", "recital"] as const;
export type MzaKind = (typeof MZA_KINDS)[number];

export function isMzaKind(kind: string | null | undefined): kind is MzaKind {
  return (MZA_KINDS as readonly string[]).includes(kind ?? "");
}

export const MZA_BOT_SLUGS: Record<string, MzaKind> = {
  "fiestas-mendoza": "evento-mza",
  "gastronomia-mendoza": "gastro",
  "recitales-mendoza": "recital",
};

// ---------- zonas y público ----------

export const MZA_ZONES = [
  "capital",
  "godoy-cruz",
  "guaymallen",
  "las-heras",
  "lujan",
  "maipu",
  "tupungato",
  "tunuyan",
  "san-rafael",
  "fuera-de-zona",
] as const;
export type MzaZone = (typeof MZA_ZONES)[number];

export const ZONE_LABELS: Record<MzaZone, string> = {
  capital: "Capital",
  "godoy-cruz": "Godoy Cruz",
  guaymallen: "Guaymallén",
  "las-heras": "Las Heras",
  lujan: "Luján",
  maipu: "Maipú",
  tupungato: "Tupungato",
  tunuyan: "Tunuyán",
  "san-rafael": "San Rafael",
  "fuera-de-zona": "Fuera de zona",
};

export const GRAN_MENDOZA: MzaZone[] = ["capital", "godoy-cruz", "guaymallen", "las-heras", "lujan", "maipu"];
export const VALLE_SAN_RAFAEL: MzaZone[] = ["tupungato", "tunuyan", "san-rafael"];

export const AUDIENCES = ["familiar", "amigos", "pareja"] as const;
export type MzaAudience = (typeof AUDIENCES)[number];
export const AUDIENCE_LABELS: Record<MzaAudience, string> = {
  familiar: "👨‍👩‍👧 Familiar",
  amigos: "🍻 Amigos",
  pareja: "💑 Pareja",
};

// ---------- schemas ----------

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .regex(/^https?:\/\//i, "Tiene que ser una URL http(s)");
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD");

const commonFields = {
  change_note: z.string().trim().max(200).optional(),
  zone: z.enum(MZA_ZONES),
  city: z.string().trim().max(80).optional(),
  audience: z.array(z.enum(AUDIENCES)).max(3).optional(),
  source_url: httpUrl,
  source_id: z.string().trim().min(1).max(160),
  image_url: httpUrl.optional(),
  price_from: z.number().min(0).max(100_000_000).optional(),
  price_text: z.string().trim().max(80).optional(),
  venue: z.string().trim().max(120).optional(),
  address: z.string().trim().max(160).optional(),
  note: z.string().trim().max(280).optional(),
};

const isoDateTime = z.string().trim().max(40).regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$/, "Fecha ISO");
const shortText = (max: number) => z.string().trim().min(1).max(max);
export const PRESALE_STATUSES = ["vigente", "agotada", "proxima"] as const;
export const CURRENCIES = ["ARS", "USD"] as const;

/** Entradas, preventas, barra libre, promos, combos y datos de puerta (Fiestas y Recitales). Todo opcional. */
const ticketingFields = {
  prices: z
    .array(z.object({ label: shortText(40), price: z.number().min(0).max(100_000_000), currency: z.enum(CURRENCIES).default("ARS") }))
    .max(12)
    .optional(),
  presales: z
    .array(
      z.object({
        label: shortText(40),
        price: z.number().min(0).max(100_000_000).optional(),
        currency: z.enum(CURRENCIES).default("ARS"),
        until: isoDateTime.optional(),
        status: z.enum(PRESALE_STATUSES),
        remaining: z.number().int().min(0).max(1_000_000).optional(),
      }),
    )
    .max(8)
    .optional(),
  open_bar: z.boolean().optional(),
  open_bar_text: z.string().trim().max(120).optional(),
  promos: z.array(shortText(120)).max(8).optional(),
  combos: z
    .array(z.object({ label: shortText(80), price: z.number().min(0).max(100_000_000).optional(), currency: z.enum(CURRENCIES).default("ARS") }))
    .max(8)
    .optional(),
  age_min: z.number().int().min(0).max(99).optional(),
  dress_code: z.string().trim().max(80).optional(),
  doors_at: z.string().trim().max(40).optional(),
  lineup: z.array(shortText(120)).max(16).optional(),
  ticket_url: httpUrl.optional(),
  ticketera: z.string().trim().max(60).optional(),
};

const baseStatus = z.enum(["activo", "cambiado", "cancelado"]).default("activo");

export const EVENTO_MZA_CATEGORIES = [
  "fiesta",
  "boliche",
  "sunset",
  "feria",
  "cultural",
  "bodega",
  "tech",
  "finde",
  "otro",
] as const;

export const eventoMzaDetailsSchema = z.object({
  ...commonFields,
  status: baseStatus,
  ...ticketingFields,
  category: z.enum(EVENTO_MZA_CATEGORIES),
  outdoor: z.boolean().optional(),
});

export const GASTRO_TYPES = ["apertura", "cata", "feria", "food-truck", "ciclo", "promo", "bodega", "otro"] as const;

export const gastroDetailsSchema = z.object({
  ...commonFields,
  status: baseStatus,
  type: z.enum(GASTRO_TYPES),
  cuisine: z.string().trim().max(60).optional(),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  hours: z.string().trim().max(120).optional(),
  instagram: z.string().trim().max(80).optional(),
  promo_from: ymd.optional(),
  promo_to: ymd.optional(),
  promo_days: z.string().trim().max(80).optional(),
});

export const RECITAL_GENRES = [
  "rock",
  "pop",
  "indie",
  "electronica",
  "folclore",
  "tango",
  "jazz",
  "clasica",
  "urbano",
  "cumbia-cuarteto",
  "metal",
  "otro",
] as const;
export const TICKET_STATUSES = ["a-la-venta", "pocas", "agotado", "aun-no"] as const;

export const recitalDetailsSchema = z.object({
  ...commonFields,
  status: z.enum(["activo", "cambiado", "cancelado", "agotado"]).default("activo"),
  artist: z.string().trim().min(1).max(120),
  support: z.array(z.string().trim().min(1).max(120)).max(8).optional(),
  genre: z.enum(RECITAL_GENRES),
  ...ticketingFields,
  ticket_url: httpUrl,
  ticket_status: z.enum(TICKET_STATUSES).optional(),
});

export type EventoMzaDetails = z.infer<typeof eventoMzaDetailsSchema>;
export type GastroDetails = z.infer<typeof gastroDetailsSchema>;
export type RecitalDetails = z.infer<typeof recitalDetailsSchema>;
export type MzaDetails = EventoMzaDetails | GastroDetails | RecitalDetails;

export const MZA_SCHEMAS = {
  "evento-mza": eventoMzaDetailsSchema,
  gastro: gastroDetailsSchema,
  recital: recitalDetailsSchema,
} as const;

/** Lee details ya guardados; tolera faltantes (posts viejos o editados a mano). */
export function asMza(kind: string, raw: unknown): (Partial<MzaDetails> & Record<string, unknown>) | null {
  if (!isMzaKind(kind) || !raw || typeof raw !== "object") return null;
  return raw as Partial<MzaDetails> & Record<string, unknown>;
}

// ---------- etiquetas y emoji ----------

export const CATEGORY_EMOJI: Record<string, string> = {
  sunset: "🌅",
  bodega: "🍷",
  fiesta: "🎉",
  boliche: "🪩",
  feria: "🎪",
  cultural: "🎭",
  tech: "💻",
  finde: "🌄",
  otro: "📍",
};
export const GASTRO_EMOJI: Record<string, string> = {
  apertura: "🆕",
  cata: "🍷",
  feria: "🍽️",
  "food-truck": "🚚",
  ciclo: "👨‍🍳",
  promo: "🏷️",
  bodega: "🍇",
  otro: "🍴",
};
export const GENRE_EMOJI: Record<string, string> = {
  rock: "🎸",
  metal: "🤘",
  pop: "🎤",
  indie: "🎧",
  electronica: "🎛️",
  folclore: "🪕",
  tango: "💃",
  jazz: "🎷",
  clasica: "🎻",
  urbano: "🎙️",
  "cumbia-cuarteto": "🪇",
  otro: "🎸",
};

export const CATEGORY_LABELS: Record<string, string> = {
  fiesta: "Fiesta",
  boliche: "Boliche",
  sunset: "Sunset",
  feria: "Feria",
  cultural: "Cultural",
  bodega: "Bodega",
  tech: "Tech",
  finde: "Finde",
  otro: "Otro",
};
export const GASTRO_LABELS: Record<string, string> = {
  apertura: "Apertura",
  cata: "Cata",
  feria: "Feria",
  "food-truck": "Food truck",
  ciclo: "Ciclo",
  promo: "Promo",
  bodega: "Bodega",
  otro: "Otro",
};
export const GENRE_LABELS: Record<string, string> = {
  rock: "Rock",
  pop: "Pop",
  indie: "Indie",
  electronica: "Electrónica",
  folclore: "Folclore",
  tango: "Tango",
  jazz: "Jazz",
  clasica: "Clásica",
  urbano: "Urbano",
  "cumbia-cuarteto": "Cumbia / cuarteto",
  metal: "Metal",
  otro: "Otro",
};
export const TICKET_LABELS: Record<string, string> = {
  "a-la-venta": "A la venta",
  pocas: "Últimas entradas",
  agotado: "Agotado",
  "aun-no": "Aún no a la venta",
};

/** Campo que agrupa por categoría en cada kind. */
export function mzaCategoryKey(kind: MzaKind): "category" | "type" | "genre" {
  return kind === "evento-mza" ? "category" : kind === "gastro" ? "type" : "genre";
}

export function mzaCategoryLabels(kind: MzaKind): Record<string, string> {
  return kind === "evento-mza" ? CATEGORY_LABELS : kind === "gastro" ? GASTRO_LABELS : GENRE_LABELS;
}

export function mzaEmoji(kind: string, details: unknown): string | null {
  if (!isMzaKind(kind)) return null;
  const d = (details ?? {}) as Record<string, unknown>;
  if (kind === "evento-mza") return CATEGORY_EMOJI[String(d.category)] ?? "📍";
  if (kind === "gastro") return GASTRO_EMOJI[String(d.type)] ?? "🍴";
  return GENRE_EMOJI[String(d.genre)] ?? "🎸";
}

// ---------- fechas ----------

function daysBetween(fromYmd: string, toYmd: string) {
  return Math.round((Date.parse(`${toYmd}T12:00:00Z`) - Date.parse(`${fromYmd}T12:00:00Z`)) / 86_400_000);
}

/** "Hoy", "Mañana", "Quedan X días" (null si ya pasó). */
export function countdownLabel(eventYmd: string, todayYmd: string): string | null {
  const diff = daysBetween(todayYmd, eventYmd);
  if (diff < 0) return null;
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return `Quedan ${diff} días`;
}

/** "Vence hoy", "Vence mañana", "Vence en X días". */
export function promoExpiryLabel(promoTo: string, todayYmd: string): string | null {
  const diff = daysBetween(todayYmd, promoTo);
  if (diff < 0) return null;
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  return `Vence en ${diff} días`;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "Hoy", "Mañana" o "Sáb 24/10". */
export function dayHeading(dayYmd: string, todayYmd: string): string {
  const diff = daysBetween(todayYmd, dayYmd);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  const date = new Date(`${dayYmd}T12:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]} ${dayYmd.slice(8, 10)}/${dayYmd.slice(5, 7)}`;
}

// ---------- agenda viva ----------

export const UNDATED_ARCHIVE_DAYS = 60;

export type MzaBuckets = {
  changes: Post[];
  days: Array<{ day: string; posts: Post[] }>;
  promos: Post[];
  undated: Post[];
  past: Post[];
};

function lastDay(post: Post): string | null {
  const end = post.event_end_at ?? post.event_at;
  return end ? baCalendarDate(end) : null;
}

/** Reparte los posts en Cambios / por día / promos / sin fecha / pasados. */
export function bucketMzaPosts(posts: Post[], now = new Date()): MzaBuckets {
  const today = baCalendarDate(now);
  const out: MzaBuckets = { changes: [], days: [], promos: [], undated: [], past: [] };
  const byDay = new Map<string, Post[]>();
  for (const post of posts) {
    const d = (post.details ?? {}) as Record<string, unknown>;
    const status = String(d.status ?? "activo");
    const until = lastDay(post);
    const promoTo = typeof d.promo_to === "string" ? d.promo_to : null;
    const isPromo = post.kind === "gastro" && (d.type === "promo" || Boolean(promoTo));

    let past: boolean;
    if (until) past = until < today;
    else if (isPromo && promoTo) past = promoTo < today;
    else past = now.getTime() - Date.parse(post.created_at) > UNDATED_ARCHIVE_DAYS * 86_400_000;
    if (past) {
      out.past.push(post);
      continue;
    }
    // Cambiados y cancelados van fijos arriba (hasta que pasa su fecha original).
    if (status === "cambiado" || status === "cancelado") {
      out.changes.push(post);
      continue;
    }
    if (isPromo && !post.event_at) {
      out.promos.push(post);
      continue;
    }
    if (post.event_at) {
      const day = baCalendarDate(post.event_at) < today ? today : baCalendarDate(post.event_at);
      byDay.set(day, [...(byDay.get(day) ?? []), post]);
    } else {
      out.undated.push(post);
    }
  }
  const byStart = (a: Post, b: Post) => (a.event_at ?? "").localeCompare(b.event_at ?? "");
  out.days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, list]) => ({ day, posts: list.sort(byStart) }));
  out.changes.sort(byStart);
  out.promos.sort((a, b) =>
    String((a.details as Record<string, unknown>)?.promo_to ?? "9999").localeCompare(
      String((b.details as Record<string, unknown>)?.promo_to ?? "9999"),
    ),
  );
  out.undated.sort((a, b) => b.created_at.localeCompare(a.created_at));
  out.past.sort((a, b) => (b.event_at ?? b.created_at).localeCompare(a.event_at ?? a.created_at));
  return out;
}

// ---------- filtros ----------

export type MzaFilters = {
  zones: string[];
  audience: string[];
  free: boolean;
  maxPrice: number | null;
  categories: string[];
  venue: string;
  unseenOnly: boolean;
};

export const EMPTY_MZA_FILTERS: MzaFilters = {
  zones: [],
  audience: [],
  free: false,
  maxPrice: null,
  categories: [],
  venue: "",
  unseenOnly: false,
};

export function countMzaFilters(f: MzaFilters): number {
  return (
    Number(f.zones.length > 0) +
    Number(f.audience.length > 0) +
    Number(f.free || f.maxPrice !== null) +
    Number(f.categories.length > 0) +
    Number(Boolean(f.venue.trim())) +
    Number(f.unseenOnly)
  );
}

function priceOf(d: Record<string, unknown>): number | null {
  if (typeof d.price_from === "number") return d.price_from;
  if (typeof d.price_text === "string" && /gratis|libre|free|sin cargo/i.test(d.price_text)) return 0;
  return null;
}

export function matchesMzaFilters(
  post: Post,
  kind: MzaKind,
  f: MzaFilters,
  isSeen: (post: Post) => boolean = () => false,
): boolean {
  const d = (post.details ?? {}) as Record<string, unknown>;
  if (f.zones.length && !f.zones.includes(String(d.zone))) return false;
  if (f.audience.length) {
    const aud = Array.isArray(d.audience) ? (d.audience as string[]) : [];
    if (!f.audience.some((a) => aud.includes(a))) return false;
  }
  const price = priceOf(d);
  if (f.free && price !== 0) return false;
  if (f.maxPrice !== null && (price === null || price > f.maxPrice)) return false;
  if (f.categories.length && !f.categories.includes(String(d[mzaCategoryKey(kind)]))) return false;
  if (f.venue.trim() && !String(d.venue ?? "").toLowerCase().includes(f.venue.trim().toLowerCase())) return false;
  if (f.unseenOnly && isSeen(post)) return false;
  return true;
}
