import { z } from "zod";
import { isHttpUrl } from "@/lib/images";

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

const requiredHttpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD");
const money = z.coerce.number().finite().min(0).max(1_000_000_000);
const score = z.coerce.number().finite().min(0).max(10);

export const OFFER_CONDITIONS = ["nuevo", "usado", "reacondicionado"] as const;
export const WORKFLOW_STATUSES = ["active", "inactive", "draft", "error"] as const;
export const WORKFLOW_RUN_STATUSES = ["success", "error", "running"] as const;
export const INDICATOR_DIRECTIONS = ["up", "down", "flat"] as const;

export const NEWSLETTER_ICONS = [
  "ai",
  "cloud",
  "security",
  "dev",
  "startups",
  "hardware",
  "open-source",
  "mobile",
  "web",
  "data",
  "other",
] as const;
export type NewsletterIcon = (typeof NEWSLETTER_ICONS)[number];

export const rankingOfferSchema = z.object({
  store: z.string().trim().min(1).max(80),
  seller: z.string().trim().max(80).optional(),
  url: requiredHttpUrl,
  price: money,
  price_as_shown: z.string().trim().max(80).optional(),
  original_price: money.optional(),
  discount_pct: z.coerce.number().finite().min(0).max(100).optional(),
  shipping_text: z.string().trim().max(120).optional(),
  shipping_cost: money.optional(),
  installments_text: z.string().trim().max(120).optional(),
  installments: z
    .object({
      count: z.coerce.number().int().min(1).max(72),
      amount: money.optional(),
      total: money.optional(),
      interest_free: z.boolean().optional(),
      card: z.string().trim().max(60).optional(),
    })
    .optional(),
  in_stock: z.boolean().optional(),
  seller_rating: z.coerce.number().finite().min(0).max(5).optional(),
  condition: z.enum(OFFER_CONDITIONS).optional(),
  notes: z.string().trim().max(280).optional(),
  rank: z.coerce.number().int().min(1).max(99).optional(),
});

export const rankingDetailsSchema = z.object({
  product_name: z.string().trim().min(1).max(160),
  product_image_url: httpUrl.optional().or(z.literal("")),
  category: z.string().trim().max(80).optional(),
  query: z.string().trim().max(200).optional(),
  currency: z.string().trim().max(8).optional(),
  offers: z.array(rankingOfferSchema).max(30).optional().default([]),
  best_offer_index: z.coerce.number().int().min(0).max(29).optional(),
  verdict: z.string().trim().max(280).optional(),
  score: score.optional(),
  price_history: z
    .array(
      z.object({
        date: ymd,
        best_price: money,
      }),
    )
    .max(60)
    .optional(),
  previous_best_price: money.optional(),
  checked_at: z.string().trim().max(40).optional(),
  lowest_price: money.optional(),
  lowest_price_at: ymd.optional(),
  lowest_price_store: z.string().trim().max(80).optional(),
  back_in_stock: z.boolean().optional(),
  source_id: z.string().trim().min(1).max(160).optional(),
});

export const newsletterStorySchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: httpUrl.optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  summary: z.string().trim().max(400).optional(),
  why_it_matters: z.string().trim().max(200).optional(),
  image_url: httpUrl.optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
});

export const newsletterSectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  icon: z.enum(NEWSLETTER_ICONS).optional(),
  items: z.array(newsletterStorySchema).max(15).optional().default([]),
});

export const newsletterDetailsSchema = z.object({
  edition_date: ymd.optional(),
  edition_number: z.coerce.number().int().min(1).max(10_000).optional(),
  headline: z.string().trim().max(200).optional(),
  tldr: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  sections: z.array(newsletterSectionSchema).max(10).optional().default([]),
  reading_minutes: z.coerce.number().int().min(1).max(180).optional(),
  quote: z
    .object({
      text: z.string().trim().min(1).max(400),
      author: z.string().trim().max(80).optional(),
    })
    .optional(),
});

export const informeIndicatorSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().max(80).optional(),
  value: z.coerce.number().finite(),
  unit: z.string().trim().max(16).optional(),
  buy: z.coerce.number().finite().optional(),
  sell: z.coerce.number().finite().optional(),
  change_abs: z.coerce.number().finite().optional(),
  change_pct: z.coerce.number().finite().optional(),
  direction: z.enum(INDICATOR_DIRECTIONS).optional(),
  source: z.string().trim().max(80).optional(),
  as_of: z.string().trim().max(40).optional(),
});

export const INFORME_RISKS = ["bajo", "medio", "alto"] as const;
export const INFORME_VERDICTS = ["si", "no", "empata"] as const;
export const INFORME_PLATFORMS = ["x", "instagram", "youtube", "tiktok", "nota"] as const;
export const INFORME_PROFILES = ["conservador", "moderado", "arriesgado"] as const;
export const INFORME_ASSET_TYPES = ["bono", "accion", "cedear"] as const;
export const INFORME_SECTION_IDS = [
  "dia_en_3_lineas",
  "dolar_simple",
  "vs_inflacion",
  "idea_prudente",
  "tecnica_sueldo",
  "referentes",
  "palabra_del_dia",
  "inflation",
  "rates",
  "ideas",
  "assets",
  "agenda",
  "highlights",
  "risks",
  "outlook",
  "disclaimer",
  "otras_secciones",
] as const;

export type InformeRisk = (typeof INFORME_RISKS)[number];
export type InformeVerdict = (typeof INFORME_VERDICTS)[number];
export type InformePlatform = (typeof INFORME_PLATFORMS)[number];
export type InformeProfile = (typeof INFORME_PROFILES)[number];
export type InformeAssetType = (typeof INFORME_ASSET_TYPES)[number];
export type InformeSectionId = (typeof INFORME_SECTION_IDS)[number];

const pct = z.coerce.number().finite().min(-100).max(10_000);
const amount = z.coerce.number().finite().min(0).max(1_000_000_000_000);
const riskField = z.enum(INFORME_RISKS);
const optionalLink = httpUrl.optional().or(z.literal(""));

export const informeDiaEn3LineasSchema = z.object({
  lines: z.array(z.string().trim().min(1).max(220)).min(1).max(3),
});

export const informeDolarSimpleSchema = z.object({
  text: z.string().trim().min(1).max(600),
});

export const informeVsInflacionSchema = z.object({
  verdict: z.enum(INFORME_VERDICTS),
  example_amount: amount,
  inflation_pct: pct,
  options: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        monthly_rate_pct: pct,
        result_amount: amount,
      }),
    )
    .max(8)
    .optional()
    .default([]),
});

export const informeIdeaPrudenteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  text: z.string().trim().min(1).max(600),
  risk: riskField,
  link: optionalLink,
});

export const informeTecnicaSueldoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(600),
  allocation: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        pct: pct,
      }),
    )
    .min(1)
    .max(8),
  example: z
    .object({
      salary: amount,
      breakdown: z
        .array(
          z.object({
            label: z.string().trim().min(1).max(80),
            amount: amount,
          }),
        )
        .max(8)
        .optional()
        .default([]),
    })
    .optional(),
  link: optionalLink,
});

export const informeReferenteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional(),
  platform: z.enum(INFORME_PLATFORMS),
  summary: z.string().trim().min(1).max(400),
  date: ymd,
  url: requiredHttpUrl,
  pinned: z.boolean().optional().default(false),
});

export const informePalabraDelDiaSchema = z.object({
  term: z.string().trim().min(1).max(80),
  definition: z.string().trim().min(1).max(400),
  link: optionalLink,
});

export const informeInflationSchema = z.object({
  month: z.string().trim().min(1).max(40),
  monthly_pct: pct,
  yoy_pct: pct,
  ytd_pct: pct,
  rem_next_pct: pct.optional(),
  next_release_date: ymd,
});

export const informeRateSchema = z.object({
  instrument: z.string().trim().min(1).max(80),
  provider: z.string().trim().min(1).max(80),
  tna_pct: pct,
  monthly_pct: pct,
  beats_inflation: z.boolean().optional().default(false),
  term: z.string().trim().max(80).optional(),
  risk: riskField,
  link: optionalLink,
});

export const informeIdeaSchema = z.object({
  name: z.string().trim().min(1).max(120),
  what_it_is: z.string().trim().min(1).max(400),
  profile: z.enum(INFORME_PROFILES),
  expected_return: z.string().trim().max(80).optional(),
  risk: riskField,
  how_to: z.string().trim().min(1).max(400),
  link: optionalLink,
});

export const informeAssetSchema = z.object({
  ticker: z.string().trim().min(1).max(16),
  name: z.string().trim().min(1).max(80),
  type: z.enum(INFORME_ASSET_TYPES),
  price: amount,
  currency: z.string().trim().min(1).max(8),
  change_pct: pct,
  note: z.string().trim().max(200).optional(),
});

export const informeAgendaItemSchema = z.object({
  date: ymd,
  time: z.string().trim().max(16).optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(280).optional(),
  link: optionalLink,
});

export const informeOtraSeccionSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  icono: z.string().trim().max(40).optional(),
  markdown: z.string().trim().min(1).max(4000),
});

export const informeSourceSchema = z.object({
  name: z.string().trim().min(1).max(80),
  url: optionalLink,
  section: z.enum(INFORME_SECTION_IDS).optional(),
});

export const informeDetailsSchema = z.object({
  date: ymd.optional(),
  summary_simple: z.string().trim().max(600).optional(),
  summary_technical: z.string().trim().max(2000).optional(),
  indicators: z.array(informeIndicatorSchema).max(30).optional().default([]),
  brecha_pct: z.coerce.number().finite().optional(),
  highlights: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  risks: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  outlook: z.string().trim().max(400).optional(),
  sources: z.array(informeSourceSchema).max(40).optional(),
  dia_en_3_lineas: informeDiaEn3LineasSchema.optional(),
  dolar_simple: informeDolarSimpleSchema.optional(),
  vs_inflacion: informeVsInflacionSchema.optional(),
  idea_prudente: informeIdeaPrudenteSchema.optional(),
  tecnica_sueldo: informeTecnicaSueldoSchema.optional(),
  referentes: z.array(informeReferenteSchema).max(20).optional(),
  palabra_del_dia: informePalabraDelDiaSchema.optional(),
  inflation: informeInflationSchema.optional(),
  rates: z.array(informeRateSchema).max(20).optional(),
  ideas: z.array(informeIdeaSchema).max(12).optional(),
  assets: z.array(informeAssetSchema).max(30).optional(),
  agenda: z.array(informeAgendaItemSchema).max(20).optional(),
  disclaimer: z.string().trim().max(400).optional(),
  otras_secciones: z.array(informeOtraSeccionSchema).max(8).optional(),
});

export const workflowNodeSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.string().trim().max(80).optional(),
});

export const workflowDetailsSchema = z.object({
  workflow_name: z.string().trim().min(1).max(160),
  workflow_url: httpUrl.optional().or(z.literal("")),
  status: z.enum(WORKFLOW_STATUSES).optional(),
  trigger_type: z.string().trim().max(40).optional(),
  trigger_detail: z.string().trim().max(160).optional(),
  schedule_text: z.string().trim().max(120).optional(),
  nodes: z.array(workflowNodeSchema).max(40).optional(),
  services: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  purpose: z.string().trim().max(400).optional(),
  steps: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  inputs: z.string().trim().max(280).optional(),
  outputs: z.string().trim().max(280).optional(),
  credentials_needed: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  last_run_at: z.string().trim().max(40).optional(),
  last_run_status: z.enum(WORKFLOW_RUN_STATUSES).optional(),
  runs_7d: z.coerce.number().int().min(0).max(1_000_000).optional(),
  errors_7d: z.coerce.number().int().min(0).max(1_000_000).optional(),
  version: z.string().trim().max(40).optional(),
  json_url: httpUrl.optional().or(z.literal("")),
  notes: z.string().trim().max(280).optional(),
});

export type RankingDetails = z.infer<typeof rankingDetailsSchema>;
export type RankingOffer = z.infer<typeof rankingOfferSchema>;
export type NewsletterDetails = z.infer<typeof newsletterDetailsSchema>;
export type InformeDetails = z.infer<typeof informeDetailsSchema>;
export type WorkflowDetails = z.infer<typeof workflowDetailsSchema>;

export function looksLikeRanking(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const value = raw as Record<string, unknown>;
  return typeof value.product_name === "string" && Array.isArray(value.offers);
}

export function asRanking(details: unknown): RankingDetails | null {
  const parsed = rankingDetailsSchema.safeParse(details ?? {});
  if (!parsed.success) return null;
  const next = { ...parsed.data };
  if (next.product_image_url === "") next.product_image_url = undefined;
  return next;
}

export function asNewsletter(details: unknown): NewsletterDetails | null {
  const parsed = newsletterDetailsSchema.safeParse(details ?? {});
  if (!parsed.success) return null;
  const data = parsed.data;
  const hasContent = Boolean(
    data.headline ||
      data.tldr?.length ||
      data.sections.some((section) => section.items.length) ||
      data.edition_number != null ||
      data.edition_date,
  );
  return hasContent ? data : null;
}

export function asInforme(details: unknown): InformeDetails | null {
  const parsed = informeDetailsSchema.safeParse(details ?? {});
  if (!parsed.success) return null;
  const data = parsed.data;
  const hasContent = Boolean(
    data.summary_simple ||
      data.summary_technical ||
      data.indicators.length ||
      data.highlights?.length ||
      data.date ||
      data.dia_en_3_lineas ||
      data.dolar_simple ||
      data.vs_inflacion ||
      data.idea_prudente ||
      data.tecnica_sueldo ||
      data.referentes?.length ||
      data.palabra_del_dia ||
      data.inflation ||
      data.rates?.length ||
      data.ideas?.length ||
      data.assets?.length ||
      data.agenda?.length ||
      data.otras_secciones?.length,
  );
  return hasContent ? blankInformeLinks(data) : null;
}

function blankInformeLinks(details: InformeDetails): InformeDetails {
  const emptyToUndef = (value?: string) => (value ? value : undefined);
  return {
    ...details,
    idea_prudente: details.idea_prudente
      ? { ...details.idea_prudente, link: emptyToUndef(details.idea_prudente.link) }
      : undefined,
    tecnica_sueldo: details.tecnica_sueldo
      ? { ...details.tecnica_sueldo, link: emptyToUndef(details.tecnica_sueldo.link) }
      : undefined,
    palabra_del_dia: details.palabra_del_dia
      ? { ...details.palabra_del_dia, link: emptyToUndef(details.palabra_del_dia.link) }
      : undefined,
    rates: details.rates?.map((row) => ({ ...row, link: emptyToUndef(row.link) })),
    ideas: details.ideas?.map((row) => ({ ...row, link: emptyToUndef(row.link) })),
    agenda: details.agenda?.map((row) => ({ ...row, link: emptyToUndef(row.link) })),
    sources: details.sources?.map((row) => ({ ...row, url: emptyToUndef(row.url) })),
  };
}

export function asWorkflow(details: unknown): WorkflowDetails | null {
  const parsed = workflowDetailsSchema.safeParse(details ?? {});
  return parsed.success ? parsed.data : null;
}

export function rankingBestOffer(details: RankingDetails): RankingOffer | null {
  if (!details.offers.length) return null;
  const indexed =
    details.best_offer_index != null ? details.offers[details.best_offer_index] : undefined;
  if (indexed) return indexed;
  return [...details.offers].sort((a, b) => a.price - b.price)[0] ?? null;
}

export function rankingBestCardOffer(details: RankingDetails): RankingOffer | null {
  const verdict = details.verdict?.toLowerCase() ?? "";
  if (!/tarjeta/.test(verdict)) return null;
  const cash = rankingBestOffer(details);
  const after = verdict.split(/tarjeta/)[1] ?? "";
  const byLength = [...details.offers].sort((a, b) => b.store.length - a.store.length);
  const namedAfter = byLength.find(
    (offer) => after.includes(offer.store.toLowerCase()) && offer.url !== cash?.url,
  );
  if (namedAfter) return namedAfter;
  const mentioned = byLength.find(
    (offer) => verdict.includes(offer.store.toLowerCase()) && offer.url !== cash?.url,
  );
  if (mentioned) return mentioned;
  return (
    details.offers.find(
      (offer) => /cuota/i.test(offer.installments_text ?? "") && offer.url !== cash?.url,
    ) ?? null
  );
}

/** Mínimo histórico: el informado por el bot o, si no, el menor de price_history / precio actual. */
export function rankingLowest(details: RankingDetails): { price: number; date?: string; store?: string } | null {
  if (details.lowest_price != null) {
    return { price: details.lowest_price, date: details.lowest_price_at, store: details.lowest_price_store };
  }
  const points: { price: number; date?: string }[] = (details.price_history ?? []).map((p) => ({ price: p.best_price, date: p.date }));
  const best = rankingBestOffer(details);
  if (best) points.push({ price: best.price, date: details.checked_at?.slice(0, 10) });
  if (!points.length) return null;
  return points.reduce((a, b) => (b.price < a.price ? b : a));
}

export function installmentsLabel(offer: RankingOffer, currency: string, fmt: (n: number, c: string) => string): string | null {
  const i = offer.installments;
  if (!i) return offer.installments_text ?? null;
  return [
    `${i.count} cuotas${i.amount != null ? ` de ${fmt(i.amount, currency)}` : ""}`,
    i.interest_free === true ? "sin interés" : i.interest_free === false ? "con interés" : null,
    i.total != null ? `total ${fmt(i.total, currency)}` : null,
    i.card ?? null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function rankingDropPct(details: RankingDetails): number | null {
  const best = rankingBestOffer(details);
  if (!best || details.previous_best_price == null || details.previous_best_price <= 0) {
    return null;
  }
  if (details.previous_best_price <= best.price) return null;
  return Math.round(
    ((details.previous_best_price - best.price) / details.previous_best_price) * 100,
  );
}

export const NEWSLETTER_ICON_LABELS: Record<NewsletterIcon, string> = {
  ai: "IA",
  cloud: "Cloud",
  security: "Seguridad",
  dev: "Dev",
  startups: "Startups",
  hardware: "Hardware",
  "open-source": "Open source",
  mobile: "Mobile",
  web: "Web",
  data: "Datos",
  other: "Otros",
};

export const WORKFLOW_STATUS_LABELS: Record<(typeof WORKFLOW_STATUSES)[number], string> = {
  active: "Activo",
  inactive: "Inactivo",
  draft: "Borrador",
  error: "Error",
};
