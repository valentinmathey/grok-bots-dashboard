import { asAlojamiento } from "@/lib/details";
import {
  baEndOfDay,
  baStartOfDay,
  eventSortAscending,
  isEventPast,
  isEventUpcoming,
} from "@/lib/event-time";
import type { FeedSort, Post, PostKind } from "@/lib/types";
import { isKindSlug } from "@/lib/validations";

export type SortOrder = "newest" | "oldest";
export type EventWhen = "upcoming" | "past";
export type FeedView = "cards" | "table";
export type { FeedSort };

export type PostFilters = {
  from?: string;
  to?: string;
  product?: string;
  kind?: PostKind;
  tag?: string;
  event_from?: string;
  event_to?: string;
  upcoming?: boolean;
  when?: EventWhen;
  dateBasis?: "created" | "event";
  eventsOnly?: boolean;
  city?: string;
  search_area?: string;
  neighborhood?: string;
  max_price_pp?: number;
  amenities?: string[];
  view?: FeedView;
  bot?: string;
  q?: string;
};

export type FeedQuery = PostFilters & {
  sort: FeedSort;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALOJAMIENTO_SORTS: FeedSort[] = [
  "score",
  "price_pp",
  "price_total",
  "rating",
  "newest",
  "oldest",
];

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function asDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && DATE_RE.test(trimmed) ? trimmed : undefined;
}

function parseAmenities(
  value: string | string[] | undefined,
): string[] | undefined {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const items = raw
    .flatMap((item) => item.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return items.length > 0 ? [...new Set(items)] : undefined;
}

export function parsePostFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PostFilters {
  const kindRaw = firstString(searchParams.kind)?.trim().toLowerCase();
  const product = firstString(searchParams.product)?.trim();
  const tag = firstString(searchParams.tag)?.trim().replace(/^#/, "").toLowerCase();
  const city = firstString(searchParams.city)?.trim();
  const searchArea = firstString(searchParams.search_area)?.trim();
  const neighborhood = firstString(searchParams.neighborhood)?.trim();
  const maxRaw = firstString(searchParams.max_price_pp)?.trim();
  const maxPrice = maxRaw ? Number(maxRaw) : NaN;
  const viewRaw = firstString(searchParams.view);

  return {
    from: asDate(firstString(searchParams.from)),
    to: asDate(firstString(searchParams.to)),
    product: product || undefined,
    kind: kindRaw && isKindSlug(kindRaw) ? kindRaw : undefined,
    tag: tag || undefined,
    event_from: asDate(firstString(searchParams.event_from)),
    event_to: asDate(firstString(searchParams.event_to)),
    city: city || undefined,
    search_area: searchArea || undefined,
    neighborhood: neighborhood || undefined,
    max_price_pp: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    amenities: parseAmenities(searchParams.amenities),
    view: viewRaw === "table" ? "table" : undefined,
  };
}

export function parseSort(
  searchParams: Record<string, string | string[] | undefined>,
  options: { hasAlojamientos?: boolean } = {},
): FeedSort {
  const raw = firstString(searchParams.sort);
  if (options.hasAlojamientos) {
    if (raw && (ALOJAMIENTO_SORTS as string[]).includes(raw)) {
      return raw as FeedSort;
    }
    return "score";
  }
  return raw === "oldest" ? "oldest" : "newest";
}

export function parseWhen(
  searchParams: Record<string, string | string[] | undefined>,
  hasEvents = false,
): EventWhen | undefined {
  const raw = firstString(searchParams.when);
  if (raw === "past" || raw === "upcoming") {
    return raw;
  }
  return hasEvents ? "upcoming" : undefined;
}

export function parseFeedQuery(
  searchParams: Record<string, string | string[] | undefined>,
  options: { hasEvents?: boolean; hasAlojamientos?: boolean } = {},
): FeedQuery {
  const hasEvents = Boolean(options.hasEvents);
  const hasAlojamientos = Boolean(options.hasAlojamientos) && !hasEvents;
  const when = parseWhen(searchParams, hasEvents);
  return {
    ...parsePostFilters(searchParams),
    sort: parseSort(searchParams, { hasAlojamientos }),
    when,
    dateBasis: hasEvents ? "event" : "created",
    eventsOnly: hasEvents,
    view: hasAlojamientos ? parsePostFilters(searchParams).view ?? "cards" : undefined,
  };
}

export function filtersToSearchParams(
  filters: PostFilters & { sort?: FeedSort },
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.product) params.set("product", filters.product);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.event_from) params.set("event_from", filters.event_from);
  if (filters.event_to) params.set("event_to", filters.event_to);
  if (filters.when) params.set("when", filters.when);
  if (filters.city) params.set("city", filters.city);
  if (filters.search_area) params.set("search_area", filters.search_area);
  if (filters.neighborhood) params.set("neighborhood", filters.neighborhood);
  if (filters.max_price_pp != null) params.set("max_price_pp", String(filters.max_price_pp));
  if (filters.amenities?.length) params.set("amenities", filters.amenities.join(","));
  if (filters.view && filters.view !== "cards") params.set("view", filters.view);
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

export function hasActiveFilters(filters: PostFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export function countActiveFilters(filters: PostFilters): number {
  return [
    filters.from,
    filters.to,
    filters.product,
    filters.kind,
    filters.tag,
    filters.city,
    filters.search_area,
    filters.neighborhood,
    filters.max_price_pp,
    filters.amenities?.length ? "amenities" : null,
  ].filter(Boolean).length;
}

export function hasAlojamientoFilters(filters: PostFilters = {}): boolean {
  return Boolean(
    filters.city ||
      filters.search_area ||
      filters.neighborhood ||
      filters.max_price_pp != null ||
      (filters.amenities && filters.amenities.length > 0),
  );
}

export function isAlojamientoSort(sort?: FeedSort): boolean {
  return sort === "score" || sort === "price_pp" || sort === "price_total" || sort === "rating";
}

export function dayStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function dayEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function eventRangeStart(ymd: string): number {
  return baStartOfDay(ymd).getTime();
}

function eventRangeEnd(ymd: string): number {
  return baEndOfDay(ymd).getTime();
}

function sameLoose(a: string | undefined, b: string | undefined): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

export function matchesFilters(post: Post, filters: PostFilters): boolean {
  if (filters.kind && post.kind !== filters.kind) {
    return false;
  }
  if (
    filters.product &&
    post.product?.trim().toLowerCase() !== filters.product.toLowerCase()
  ) {
    return false;
  }
  if (filters.tag && !post.tags.includes(filters.tag)) {
    return false;
  }
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    const hay = `${post.title}\n${post.body_markdown}`.toLowerCase();
    if (!needle || !hay.includes(needle)) {
      return false;
    }
  }

  if (filters.eventsOnly && !post.event_at) {
    return false;
  }
  if (filters.when === "upcoming" && !isEventUpcoming(post)) {
    return false;
  }
  if (filters.when === "past" && !isEventPast(post)) {
    return false;
  }
  if (filters.upcoming === true && !isEventUpcoming(post)) {
    return false;
  }
  if (filters.upcoming === false && !isEventPast(post)) {
    return false;
  }

  const created = new Date(post.created_at).getTime();
  const useEventDates = filters.dateBasis === "event";
  if (useEventDates) {
    if (!post.event_at) {
      return false;
    }
    const eventStart = new Date(post.event_at).getTime();
    if (filters.from && eventStart < eventRangeStart(filters.from)) {
      return false;
    }
    if (filters.to && eventStart > eventRangeEnd(filters.to)) {
      return false;
    }
  } else {
    if (filters.from && created < new Date(dayStartIso(filters.from)).getTime()) {
      return false;
    }
    if (filters.to && created > new Date(dayEndIso(filters.to)).getTime()) {
      return false;
    }
  }

  if (filters.event_from || filters.event_to) {
    if (!post.event_at) {
      return false;
    }
    const eventStart = new Date(post.event_at).getTime();
    if (filters.event_from && eventStart < eventRangeStart(filters.event_from)) {
      return false;
    }
    if (filters.event_to && eventStart > eventRangeEnd(filters.event_to)) {
      return false;
    }
  }

  if (hasAlojamientoFilters(filters)) {
    const details = asAlojamiento(post.details);
    if (!details) {
      return false;
    }
    if (filters.city && !sameLoose(details.city, filters.city)) {
      return false;
    }
    if (filters.search_area && !sameLoose(details.search_area, filters.search_area)) {
      return false;
    }
    if (filters.neighborhood && !sameLoose(details.neighborhood, filters.neighborhood)) {
      return false;
    }
    if (
      filters.max_price_pp != null &&
      (details.price_per_person == null || details.price_per_person > filters.max_price_pp)
    ) {
      return false;
    }
    if (filters.amenities?.length) {
      const have = new Set((details.amenities ?? []).map((item) => item.toLowerCase()));
      if (!filters.amenities.every((item) => have.has(item.toLowerCase()))) {
        return false;
      }
    }
  }

  return true;
}

function alojamientoSortValue(post: Post, sort: FeedSort): number | null {
  const details = asAlojamiento(post.details);
  if (!details) return null;
  if (sort === "score") return details.score ?? null;
  if (sort === "rating") return details.rating ?? null;
  if (sort === "price_pp") return details.price_per_person ?? null;
  if (sort === "price_total") return details.price_total ?? null;
  return null;
}

export function sortPosts(
  posts: Post[],
  sort: FeedSort = "newest",
  when?: EventWhen,
): Post[] {
  const copy = [...posts];
  if (when) {
    const ascending = eventSortAscending(sort === "oldest" ? "oldest" : "newest", when);
    copy.sort((a, b) => {
      if (a.event_at && b.event_at) {
        const delta =
          new Date(a.event_at).getTime() - new Date(b.event_at).getTime();
        return ascending ? delta : -delta;
      }
      return 0;
    });
    return copy;
  }

  if (isAlojamientoSort(sort)) {
    const cheaperFirst = sort === "price_pp" || sort === "price_total";
    copy.sort((a, b) => {
      const va = alojamientoSortValue(a, sort);
      const vb = alojamientoSortValue(b, sort);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return cheaperFirst ? va - vb : vb - va;
    });
    return copy;
  }

  copy.sort((a, b) => {
    const delta =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sort === "oldest" ? delta : -delta;
  });
  return copy;
}

export function normalizeProduct(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const PAGE_SIZE = 12;
