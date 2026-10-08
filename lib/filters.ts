import { POST_KINDS, type Post, type PostKind } from "@/lib/types";

export type PostFilters = {
  from?: string;
  to?: string;
  product?: string;
  kind?: PostKind;
  tag?: string;
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
  const kindRaw = firstString(searchParams.kind)?.trim();
  const kind = POST_KINDS.find((item) => item === kindRaw);
  const product = firstString(searchParams.product)?.trim();
  const tag = firstString(searchParams.tag)?.trim().replace(/^#/, "").toLowerCase();

  return {
    from: asDate(firstString(searchParams.from)),
    to: asDate(firstString(searchParams.to)),
    product: product || undefined,
    kind,
    tag: tag || undefined,
  };
}

export function filtersToSearchParams(filters: PostFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.product) params.set("product", filters.product);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.tag) params.set("tag", filters.tag);
  return params;
}

export function hasActiveFilters(filters: PostFilters): boolean {
  return Boolean(
    filters.from || filters.to || filters.product || filters.kind || filters.tag,
  );
}

export function dayStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function dayEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
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
  const created = new Date(post.created_at).getTime();
  if (filters.from && created < new Date(dayStartIso(filters.from)).getTime()) {
    return false;
  }
  if (filters.to && created > new Date(dayEndIso(filters.to)).getTime()) {
    return false;
  }
  return true;
}

export function normalizeProduct(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
