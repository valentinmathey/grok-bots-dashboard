import { z } from "zod";
import { isHttpUrl } from "@/lib/images";

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
});

export const resumenDetailsSchema = z.object({
  week_key: z.string().regex(/^\d{4}-W\d{2}$/, "week_key tiene que ser YYYY-Www"),
  period_from: ymd,
  period_to: ymd,
  generated_at: z.string().trim().min(1).max(40),
  bots: z.array(resumenBotSchema).max(40),
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
export type PostDetails = AlojamientoDetails | ResumenDetails | Record<string, unknown>;

export function parsePostDetails(
  kind: string,
  raw: unknown,
):
  | { ok: true; details: PostDetails | null }
  | { ok: false; message: string; issues?: unknown } {
  if (raw === undefined || raw === null || raw === "") {
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
