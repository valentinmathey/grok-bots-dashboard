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
  url: requiredHttpUrl,
  price: money,
  price_as_shown: z.string().trim().max(80).optional(),
  original_price: money.optional(),
  discount_pct: z.coerce.number().finite().min(0).max(100).optional(),
  shipping_text: z.string().trim().max(120).optional(),
  shipping_cost: money.optional(),
  installments_text: z.string().trim().max(120).optional(),
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

export const informeDetailsSchema = z.object({
  date: ymd.optional(),
  summary_simple: z.string().trim().max(600).optional(),
  summary_technical: z.string().trim().max(2000).optional(),
  indicators: z.array(informeIndicatorSchema).max(30).optional().default([]),
  brecha_pct: z.coerce.number().finite().optional(),
  highlights: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  risks: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  outlook: z.string().trim().max(400).optional(),
  sources: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        url: httpUrl.optional().or(z.literal("")),
      }),
    )
    .max(20)
    .optional(),
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
      data.date,
  );
  return hasContent ? data : null;
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
