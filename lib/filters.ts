import { isKindSlug } from "@/lib/validations";
import {
  baEndOfDay,
  baStartOfDay,
  isEventPast,
  isEventUpcoming,
} from "@/lib/event-time";
import type { Post, PostKind } from "@/lib/types";

export type SortOrder = "newest" | "oldest";
export type EventWhen = "upcoming" | "past";

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
};

export type FeedQuery = PostFilters & {
  sort: SortOrder;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export function parsePostFilters(
  searchParams: Record<string, string | string[] | undefined>,
): PostFilters {
  const kindRaw = firstString(searchParams.kind)?.trim().toLowerCase();
  const product = firstString(searchParams.product)?.trim();
  const tag = firstString(searchParams.tag)?.trim().replace(/^#/, "").toLowerCase();

  return {
    from: asDate(firstString(searchParams.from)),
    to: asDate(firstString(searchParams.to)),
    product: product || undefined,
    kind: kindRaw && isKindSlug(kindRaw) ? kindRaw : undefined,
    tag: tag || undefined,
    event_from: asDate(firstString(searchParams.event_from)),
    event_to: asDate(firstString(searchParams.event_to)),
  };
}

export function parseSort(
  searchParams: Record<string, string | string[] | undefined>,
): SortOrder {
  return firstString(searchParams.sort) === "oldest" ? "oldest" : "newest";
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
  options: { hasEvents?: boolean } = {},
): FeedQuery {
  const hasEvents = Boolean(options.hasEvents);
  const when = parseWhen(searchParams, hasEvents);
  return {
    ...parsePostFilters(searchParams),
    sort: parseSort(searchParams),
    when,
    dateBasis: hasEvents ? "event" : "created",
    eventsOnly: hasEvents,
  };
}

export function filtersToSearchParams(
  filters: PostFilters & { sort?: SortOrder },
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
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
}

export function hasActiveFilters(filters: PostFilters): boolean {
  return Boolean(
    filters.from || filters.to || filters.product || filters.kind || filters.tag,
  );
}

export function countActiveFilters(filters: PostFilters): number {
  return [filters.from, filters.to, filters.product, filters.kind, filters.tag].filter(
    Boolean,
  ).length;
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

  return true;
}

export function normalizeProduct(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const PAGE_SIZE = 12;
