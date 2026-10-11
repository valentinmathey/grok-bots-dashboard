import { z } from "zod";
import {
  baCalendarDate,
  parseEventInstant,
} from "@/lib/event-time";
import { isHttpUrl } from "@/lib/images";
import {
  informeDetailsSchema,
  looksLikeRanking,
  newsletterDetailsSchema,
  rankingDetailsSchema,
  workflowDetailsSchema,
} from "@/lib/rich-details";

export const ALOJAMIENTO_PLATFORMS = ["airbnb", "booking", "otro"] as const;
export type AlojamientoPlatform = (typeof ALOJAMIENTO_PLATFORMS)[number];

export const ALOJAMIENTO_AMENITIES = [
  "pool",
  "parking",
  "wifi",
  "ac",
  "grill",
  "kitchen",
  "washer",
  "sea_view",
  "pet_friendly",
  "tv",
  "heating",
  "workspace",
  "beach_access",
] as const;
export type AlojamientoAmenity = (typeof ALOJAMIENTO_AMENITIES)[number];

export const AMENITY_LABELS: Record<AlojamientoAmenity, string> = {
  pool: "Pileta",
  parking: "Cochera",
  wifi: "Wi‑Fi",
  ac: "Aire",
  grill: "Parrilla",
  kitchen: "Cocina",
  washer: "Lavarropas",
  sea_view: "Vista al mar",
  pet_friendly: "Mascotas",
  tv: "TV",
  heating: "Calefacción",
  workspace: "Escritorio",
  beach_access: "Playa",
};

export const PLATFORM_LABELS: Record<AlojamientoPlatform, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  otro: "Otra plataforma",
};

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD");

const money = z.coerce.number().finite().min(0).max(10_000_000);
const score = z.coerce.number().finite().min(0).max(10);

export const alojamientoUnitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: httpUrl.optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(40).optional(),
  price: money.optional(),
});

export const alojamientoDetailsSchema = z.object({
  platform: z.enum(ALOJAMIENTO_PLATFORMS).optional(),
  listing_url: httpUrl.optional().or(z.literal("")),
  search_area: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(200).optional(),
  lat: z.coerce.number().finite().min(-90).max(90).optional(),
  lng: z.coerce.number().finite().min(-180).max(180).optional(),
  maps_url: httpUrl.optional().or(z.literal("")),
  check_in: ymd.optional(),
  check_out: ymd.optional(),
  nights: z.coerce.number().int().min(1).max(365).optional(),
  guests: z.coerce.number().int().min(1).max(40).optional(),
  capacity: z.coerce.number().int().min(1).max(40).optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  beds: z.coerce.number().int().min(0).max(40).optional(),
  bathrooms: z.coerce.number().min(0).max(20).optional(),
  property_type: z.string().trim().max(60).optional(),
  is_combination: z.boolean().optional(),
  units: z.array(alojamientoUnitSchema).max(6).optional(),
  price_total: money.optional(),
  price_per_person: money.optional(),
  price_per_night: money.optional(),
  currency: z.string().trim().max(8).optional(),
  price_as_shown: z.string().trim().max(80).optional(),
  cleaning_fee: money.optional(),
  service_fee: money.optional(),
  rating: z.coerce.number().finite().min(0).max(5).optional(),
  reviews_count: z.coerce.number().int().min(0).max(1_000_000).optional(),
  superhost: z.boolean().optional(),
  badges: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  distance_to_beach: z.coerce.number().int().min(0).max(100_000).optional(),
  amenities: z.array(z.string().trim().min(1).max(32)).max(24).optional(),
  includes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  excludes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  cancellation: z.string().trim().max(200).optional(),
  pros: z.array(z.string().trim().min(1).max(160)).max(12).optional(),
  cons: z.array(z.string().trim().min(1).max(160)).max(12).optional(),
  score: score.optional(),
  rank: z.coerce.number().int().min(1).max(999).optional(),
  last_checked_at: z.string().trim().max(40).optional(),
  previous_price_total: money.optional(),
  previous_price_per_person: money.optional(),
});

export const resumenEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  event_at: z.string().trim().min(1).max(40),
  event_end_at: z.string().trim().max(40).optional().nullable(),
  post_id: z.string().trim().max(64).optional(),
});

export const resumenHighlightSchema = z.object({
  title: z.string().trim().min(1).max(200),
  post_id: z.string().trim().max(64).optional(),
  score: score.optional(),
  price_per_person: money.optional(),
  price_total: money.optional(),
  currency: z.string().trim().max(8).optional(),
  from: money.optional(),
  to: money.optional(),
});

export const resumenBotSchema = z.object({
  bot_id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(64),
  avatar_color: z.string().trim().max(32).optional().nullable(),
  avatar_url: z.string().trim().max(2000).optional().nullable(),
  status: z.string().trim().max(280).optional().nullable(),
  new_posts: z.coerce.number().int().min(0).max(10_000),
  upcoming_events: z.array(resumenEventSchema).max(20).optional().default([]),
  alojamientos: z
    .object({
      new_count: z.coerce.number().int().min(0).max(10_000),
      best: resumenHighlightSchema.optional(),
      cheapest: resumenHighlightSchema.optional(),
      price_drops: z.array(resumenHighlightSchema).max(12).optional().default([]),
    })
    .optional(),
  products: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        posts: z.coerce.number().int().min(0).max(10_000),
      }),
    )
    .max(20)
    .optional(),
  kinds: z
    .array(
      z.object({
        kind: z.string().trim().min(1).max(32),
        count: z.coerce.number().int().min(0).max(10_000),
        latest: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(200),
              post_id: z.string().trim().max(64),
            }),
          )
          .max(5)
          .optional()
          .default([]),
      }),
    )
    .max(24)
    .optional(),
  oportunidades: z
    .object({
      open_count: z.coerce.number().int().min(0).max(10_000),
      recommended_count: z.coerce.number().int().min(0).max(10_000),
      next_deadlines: z
        .array(
          z.object({
            name: z.string().trim().min(1).max(160),
            deadline: z.string().trim().min(1).max(40),
            category: z.string().trim().max(32).optional(),
            post_id: z.string().trim().max(64).optional(),
            prize_text: z.string().trim().max(120).optional(),
          }),
        )
        .max(8)
        .optional()
        .default([]),
    })
    .optional(),
  ranking: z
    .object({
      new_count: z.coerce.number().int().min(0).max(10_000),
      product_name: z.string().trim().max(160).optional(),
      best_price: z.coerce.number().finite().optional(),
      currency: z.string().trim().max(8).optional(),
      drop_pct: z.coerce.number().finite().optional(),
      post_id: z.string().trim().max(64).optional(),
    })
    .optional(),
  newsletter: z
    .object({
      new_count: z.coerce.number().int().min(0).max(10_000),
      headline: z.string().trim().max(200).optional(),
      edition_date: z.string().trim().max(20).optional(),
      post_id: z.string().trim().max(64).optional(),
    })
    .optional(),
  informe: z
    .object({
      new_count: z.coerce.number().int().min(0).max(10_000),
      brecha_pct: z.coerce.number().finite().optional(),
      headline: z.string().trim().max(200).optional(),
      post_id: z.string().trim().max(64).optional(),
    })
    .optional(),
  workflow: z
    .object({
      new_count: z.coerce.number().int().min(0).max(10_000),
      workflow_name: z.string().trim().max(160).optional(),
      status: z.string().trim().max(32).optional(),
      last_run_status: z.string().trim().max(32).optional(),
      post_id: z.string().trim().max(64).optional(),
    })
    .optional(),
});

export const resumenDetailsSchema = z.object({
  week_key: z.string().regex(/^\d{4}-W\d{2}$/, "week_key tiene que ser YYYY-Www"),
  period_from: ymd,
  period_to: ymd,
  generated_at: z.string().trim().min(1).max(40),
  bots: z.array(resumenBotSchema).max(40),
});

export const OPORTUNIDAD_CATEGORIES = [
  "hackaton",
  "bounty",
  "beca",
  "curso",
  "grant",
  "creditos",
  "concurso",
  "empleo",
  "freelance",
  "oferta",
  "otro",
] as const;
export type OportunidadCategory = (typeof OPORTUNIDAD_CATEGORIES)[number];

export const OPORTUNIDAD_CATEGORY_LABELS: Record<OportunidadCategory, string> = {
  hackaton: "Hackatón",
  bounty: "Bounty",
  beca: "Beca",
  curso: "Curso",
  grant: "Grant",
  creditos: "Créditos",
  concurso: "Concurso",
  empleo: "Empleo",
  freelance: "Freelance",
  oferta: "Oferta",
  otro: "Otro",
};

export const OPORTUNIDAD_MODALITIES = ["online", "presencial", "hibrido"] as const;
export type OportunidadModality = (typeof OPORTUNIDAD_MODALITIES)[number];

export const OPORTUNIDAD_MODALITY_LABELS: Record<OportunidadModality, string> = {
  online: "En línea",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export const OPORTUNIDAD_EFFORTS = ["bajo", "medio", "alto"] as const;
export type OportunidadEffort = (typeof OPORTUNIDAD_EFFORTS)[number];

export const OPORTUNIDAD_EFFORT_LABELS: Record<OportunidadEffort, string> = {
  bajo: "Esfuerzo bajo",
  medio: "Esfuerzo medio",
  alto: "Esfuerzo alto",
};

const requiredHttpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

const deadlineField = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((value, ctx) => {
    const parsed = parseEventInstant(value);
    if (!parsed.ok) {
      ctx.addIssue({
        code: "custom",
        message: "deadline: usá ISO 8601 o YYYY-MM-DD (hora Argentina)",
      });
      return z.NEVER;
    }
    return parsed.iso;
  });

export const oportunidadItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  url: requiredHttpUrl,
  category: z.enum(OPORTUNIDAD_CATEGORIES),
  organization: z.string().trim().max(120).optional(),
  prize_text: z.string().trim().max(120).optional(),
  prize_value: z.coerce.number().finite().min(0).max(1_000_000_000).optional(),
  prize_currency: z.string().trim().max(8).optional(),
  deadline: deadlineField.optional(),
  modality: z.enum(OPORTUNIDAD_MODALITIES).optional(),
  location: z.string().trim().max(120).optional(),
  effort: z.enum(OPORTUNIDAD_EFFORTS).optional(),
  effort_text: z.string().trim().max(80).optional(),
  how_to: z.string().trim().max(280).optional(),
  recommended: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  image_url: httpUrl.optional().or(z.literal("")),
  notes: z.string().trim().max(280).optional(),
});

export const oportunidadesDetailsSchema = z.object({
  period_label: z.string().trim().max(80).optional(),
  items: z.array(oportunidadItemSchema).min(1).max(60),
});

export const looseDetailsSchema = z
  .record(z.string(), z.unknown())
  .refine((value) => Object.keys(value).length <= 40, {
    message: "details admite como máximo 40 claves",
  })
  .refine((value) => JSON.stringify(value).length <= 32_000, {
    message: "details no puede superar 32 KB",
  });

export type AlojamientoDetails = z.infer<typeof alojamientoDetailsSchema>;
export type ResumenDetails = z.infer<typeof resumenDetailsSchema>;
export type ResumenHighlight = z.infer<typeof resumenHighlightSchema>;
export type OportunidadItem = z.infer<typeof oportunidadItemSchema>;
export type OportunidadesDetails = z.infer<typeof oportunidadesDetailsSchema>;
export type PostDetails =
  | AlojamientoDetails
  | ResumenDetails
  | OportunidadesDetails
  | Record<string, unknown>;

export type OportunidadItemFilters = {
  category?: string;
  recommended?: boolean;
  openOnly?: boolean;
};

export type DeadlineTone = "ok" | "soon" | "urgent" | "closed" | "none";

export function parsePostDetails(
  kind: string,
  raw: unknown,
):
  | { ok: true; details: PostDetails | null }
  | { ok: false; message: string; issues?: unknown } {
  if (raw === undefined || raw === null || raw === "") {
    if (kind === "oportunidades") {
      return {
        ok: false,
        message: "kind oportunidades requiere details.items (1 a 60)",
      };
    }
    return { ok: true, details: null };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "details tiene que ser un objeto JSON" };
  }

  if (kind === "alojamiento") {
    const parsed = alojamientoDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details de alojamiento no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: normalizeAlojamiento(parsed.data) };
  }

  if (kind === "resumen") {
    const parsed = resumenDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details del resumen no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: parsed.data };
  }

  if (kind === "oportunidades") {
    const parsed = oportunidadesDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details de oportunidades no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: normalizeOportunidades(parsed.data) };
  }

  if (kind === "ranking" || (kind === "report" && looksLikeRanking(raw))) {
    const parsed = rankingDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details de ranking no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: parsed.data };
  }

  if (kind === "newsletter") {
    const parsed = newsletterDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details de newsletter no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: parsed.data };
  }

  if (kind === "informe") {
    const parsed = informeDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details del informe no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: parsed.data };
  }

  if (kind === "workflow") {
    const parsed = workflowDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Los details de workflow no son válidos",
        issues: parsed.error.issues,
      };
    }
    return { ok: true, details: parsed.data };
  }

  const parsed = looseDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "details no es válido para este tipo de post",
      issues: parsed.error.issues,
    };
  }
  return { ok: true, details: parsed.data };
}

export function normalizeAlojamiento(details: AlojamientoDetails): AlojamientoDetails {
  const next = { ...details };
  if (!next.maps_url && next.lat != null && next.lng != null) {
    next.maps_url = `https://www.google.com/maps?q=${next.lat},${next.lng}`;
  }
  if (next.listing_url === "") next.listing_url = undefined;
  if (next.maps_url === "") next.maps_url = undefined;
  if (next.amenities) {
    next.amenities = [...new Set(next.amenities.map((item) => item.trim().toLowerCase()))];
  }
  return next;
}

export function asAlojamiento(details: unknown): AlojamientoDetails | null {
  const parsed = alojamientoDetailsSchema.safeParse(details ?? {});
  return parsed.success ? normalizeAlojamiento(parsed.data) : null;
}

export function asResumen(details: unknown): ResumenDetails | null {
  const parsed = resumenDetailsSchema.safeParse(details ?? {});
  return parsed.success ? parsed.data : null;
}

export function normalizeOportunidades(details: OportunidadesDetails): OportunidadesDetails {
  return {
    period_label: details.period_label?.trim() || undefined,
    items: details.items.map((item) => ({
      ...item,
      organization: item.organization?.trim() || undefined,
      prize_text: item.prize_text?.trim() || undefined,
      prize_currency: item.prize_currency?.trim() || undefined,
      location: item.location?.trim() || undefined,
      effort_text: item.effort_text?.trim() || undefined,
      how_to: item.how_to?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      image_url: item.image_url ? item.image_url : undefined,
      tags: item.tags?.length ? item.tags : undefined,
    })),
  };
}

export function asOportunidades(details: unknown): OportunidadesDetails | null {
  const parsed = oportunidadesDetailsSchema.safeParse(details ?? {});
  return parsed.success ? normalizeOportunidades(parsed.data) : null;
}

export function isOportunidadCategory(value: string): value is OportunidadCategory {
  return (OPORTUNIDAD_CATEGORIES as readonly string[]).includes(value);
}

export function oportunidadCategoryLabel(value: string): string {
  return OPORTUNIDAD_CATEGORY_LABELS[value as OportunidadCategory] ?? value;
}

export function isOpportunityClosed(deadline?: string, now = new Date()): boolean {
  if (!deadline) return false;
  return baCalendarDate(now) > baCalendarDate(deadline);
}

export function daysUntilDeadline(deadline: string, now = new Date()): number {
  const from = baCalendarDate(now);
  const to = baCalendarDate(deadline);
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  return Math.round((end - start) / 86_400_000);
}

export function deadlineTone(deadline?: string, now = new Date()): DeadlineTone {
  if (!deadline) return "none";
  const days = daysUntilDeadline(deadline, now);
  if (days < 0) return "closed";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "ok";
}

function deadlineDayMonth(deadline: string): string {
  const ymd = baCalendarDate(deadline);
  const [, month, day] = ymd.split("-");
  return `${Number(day)}/${month}`;
}

export function deadlineChipLabel(deadline?: string, now = new Date()): string {
  if (!deadline) return "Sin fecha";
  const days = daysUntilDeadline(deadline, now);
  if (days < 0) return "Cerrada";
  const date = deadlineDayMonth(deadline);
  if (days === 0) return `Cierra hoy · ${date}`;
  if (days === 1) return `Cierra en 1 día · ${date}`;
  return `Cierra en ${days} días · ${date}`;
}

export type PrizePill = {
  label: string;
  kind: "cash" | "credits" | "other";
};

export function splitPrizePills(prizeText?: string | null): PrizePill[] {
  const text = prizeText?.trim();
  if (!text) return [];
  const parts = text
    .split(/\s+(?:\+|y|&)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const pills = (parts.length > 1 ? parts : [text]).map((part) => {
    const credits = /cr[eé]dit/i.test(part);
    const cash = /cash|efectivo|usd|us\$|ars|\$/i.test(part);
    return {
      label: part,
      kind: credits ? "credits" : cash ? "cash" : "other",
    } as PrizePill;
  });
  return pills;
}

export function effortChipLabel(item: {
  effort?: OportunidadEffort;
  effort_text?: string | null;
}): string | null {
  const raw = item.effort_text?.trim() || (item.effort ? OPORTUNIDAD_EFFORT_LABELS[item.effort] : "");
  if (!raw) return null;
  if (/^esfuerzo\b/i.test(raw)) return raw;
  return `Esfuerzo: ${raw}`;
}

export function opportunitySourceHost(url?: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

export function opportunityCalendarUrl(item: {
  name: string;
  deadline?: string;
  organization?: string;
  url?: string;
}): string | null {
  if (!item.deadline) return null;
  const start = baCalendarDate(item.deadline).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.name,
    dates: `${start}/${start}`,
    details: [item.organization, item.url].filter(Boolean).join(" · "),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function filterOportunidadItems(
  items: OportunidadItem[],
  filters: OportunidadItemFilters = {},
  now = new Date(),
): OportunidadItem[] {
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.recommended && !item.recommended) return false;
    if (filters.openOnly && isOpportunityClosed(item.deadline, now)) return false;
    return true;
  });
}

export function sortOportunidadItems(
  items: OportunidadItem[],
  sort?: string,
): OportunidadItem[] {
  const copy = [...items];
  if (sort === "deadline") {
    copy.sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
    return copy;
  }
  if (sort === "prize") {
    copy.sort((a, b) => (b.prize_value ?? -1) - (a.prize_value ?? -1));
    return copy;
  }
  return copy;
}

export function collectOportunidadesFacets(
  posts: Array<{ kind?: string; details?: unknown }>,
) {
  const categories = new Set<OportunidadCategory>();
  for (const post of posts) {
    if (post.kind !== "oportunidades") continue;
    const details = asOportunidades(post.details);
    if (!details) continue;
    for (const item of details.items) {
      categories.add(item.category);
    }
  }
  return {
    categories: OPORTUNIDAD_CATEGORIES.filter((category) => categories.has(category)),
  };
}

export function hasPriceDrop(details: AlojamientoDetails | null | undefined): boolean {
  if (!details) return false;
  if (
    details.previous_price_total != null &&
    details.price_total != null &&
    details.previous_price_total > details.price_total
  ) {
    return true;
  }
  return Boolean(
    details.previous_price_per_person != null &&
      details.price_per_person != null &&
      details.previous_price_per_person > details.price_per_person,
  );
}

export function amenityLabel(value: string): string {
  return AMENITY_LABELS[value as AlojamientoAmenity] ?? value;
}

export function isAmenity(value: string): value is AlojamientoAmenity {
  return (ALOJAMIENTO_AMENITIES as readonly string[]).includes(value);
}

export const SUMMARY_BOT_SLUG = "paraguayo-crack";

export function collectAlojamientoFacets(posts: Array<{ kind?: string; details?: unknown }>) {
  const cities = new Set<string>();
  const neighborhoods = new Set<string>();
  const searchAreas = new Set<string>();
  const amenities = new Set<string>();
  for (const post of posts) {
    if (post.kind !== "alojamiento") continue;
    const details = asAlojamiento(post.details);
    if (!details) continue;
    if (details.city) cities.add(details.city);
    if (details.neighborhood) neighborhoods.add(details.neighborhood);
    if (details.search_area) searchAreas.add(details.search_area);
    for (const amenity of details.amenities ?? []) {
      amenities.add(amenity);
    }
  }
  const byEs = (a: string, b: string) => a.localeCompare(b, "es");
  return {
    cities: [...cities].sort(byEs),
    neighborhoods: [...neighborhoods].sort(byEs),
    search_areas: [...searchAreas].sort(byEs),
    amenities: [...amenities].sort(byEs),
  };
}

export function emptyDetails(): Record<string, unknown> {
  return {};
}
