import { previewPlain } from "@/lib/format";
import { readImportance } from "@/lib/importance";
import {
  matchesSearchUiFilters,
  searchUiHasAdvanced,
  type SearchUiFilters,
} from "@/lib/search-filters";
import type { Bot, Post } from "@/lib/types";

export type SearchFilters = {
  q: string;
  bots?: string[];
  kinds?: string[];
  from?: string;
  to?: string;
  favoritesOnly?: boolean;
  sort?: "relevance" | "newest";
  limit?: number;
  offset?: number;
  /** Multi-select details.importance (legacy; prefer ui.importance). */
  importance?: string[];
  /** Filtros del sheet de Buscar (fecha evento, edad, etc.). */
  ui?: SearchUiFilters;
  favoriteIds?: string[];
  registeredIds?: string[];
};

export type SearchHit = {
  id: string;
  title: string;
  kind: string;
  snippet: string;
  created_at: string;
  bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
  url: string;
  importance?: string | null;
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function highlightSnippet(text: string, q: string, max = 180): string {
  const plain = previewPlain(text).slice(0, max * 2);
  const words = q
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
  let start = 0;
  const folded = fold(plain);
  for (const word of words) {
    const idx = folded.indexOf(fold(word));
    if (idx >= 0) {
      start = Math.max(0, idx - 40);
      break;
    }
  }
  const slice = plain.slice(start, start + max);
  let html = escapeHtml(slice);
  for (const word of words) {
    const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    html = html.replace(re, "<mark>$&</mark>");
  }
  return `${start > 0 ? "…" : ""}${html}${plain.length > start + max ? "…" : ""}`;
}

export function detailsHaystack(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const value = details as Record<string, unknown>;
  const bits = [
    value.neighborhood,
    value.city,
    value.search_area,
    value.product_name,
    value.headline,
    value.workflow_name,
  ];
  if (Array.isArray(value.items)) {
    for (const item of value.items) {
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        bits.push(row.name, row.organization);
      }
    }
  }
  if (Array.isArray(value.offers)) {
    for (const offer of value.offers) {
      if (offer && typeof offer === "object") {
        bits.push((offer as { store?: unknown }).store);
      }
    }
  }
  if (Array.isArray(value.services)) bits.push(...value.services);
  return bits.filter((bit) => typeof bit === "string").join(" ");
}

export function memorySearch(
  posts: Array<Post & { bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url"> }>,
  filters: SearchFilters,
): { hits: SearchHit[]; total: number } {
  const q = filters.q.trim();
  const hasScope = Boolean(
    filters.kinds?.length ||
      filters.from ||
      filters.to ||
      filters.bots?.length ||
      filters.importance?.length ||
      (filters.ui && searchUiHasAdvanced(filters.ui)),
  );
  if (q.length < 2 && !hasScope) return { hits: [], total: 0 };
  const needle = fold(q);
  const words = needle.split(/\s+/).filter(Boolean);
  const favSet = filters.favoriteIds ? new Set(filters.favoriteIds) : undefined;
  const regSet = filters.registeredIds ? new Set(filters.registeredIds) : undefined;
  const scored = posts
    .filter((post) => {
      if (filters.bots?.length && !filters.bots.includes(post.bot.slug) && !filters.bots.includes(post.bot.id)) {
        return false;
      }
      if (filters.kinds?.length && !filters.kinds.includes(post.kind)) return false;
      // from/to en SearchFilters = fecha de publicación (legacy API).
      if (filters.from && post.created_at.slice(0, 10) < filters.from) return false;
      if (filters.to && post.created_at.slice(0, 10) > filters.to) return false;
      if (filters.ui && !matchesSearchUiFilters(post, filters.ui, { favoriteIds: favSet, registeredIds: regSet })) {
        return false;
      }
      return true;
    })
    .map((post) => {
      const hay = fold(
        `${post.title} ${post.product ?? ""} ${post.tags.join(" ")} ${post.body_markdown} ${detailsHaystack(post.details)}`,
      );
      if (words.length && !words.every((word) => hay.includes(word))) return null;
      let rank = 0;
      const title = fold(post.title);
      if (title.includes(needle)) rank += 8;
      for (const word of words) {
        if (title.includes(word)) rank += 4;
        if (hay.includes(word)) rank += 1;
      }
      return { post, rank };
    })
    .filter((row): row is { post: (typeof posts)[number]; rank: number } => row != null)
    .sort((a, b) =>
      filters.sort === "newest"
        ? b.post.created_at.localeCompare(a.post.created_at)
        : b.rank - a.rank || b.post.created_at.localeCompare(a.post.created_at),
    );

  const total = scored.length;
  const offset = filters.offset ?? 0;
  const limit = Math.min(filters.limit ?? 20, 50);
  return {
    total,
    hits: scored.slice(offset, offset + limit).map(({ post }) => ({
      id: post.id,
      title: post.title,
      kind: post.kind,
      snippet: highlightSnippet(`${post.title}. ${post.body_markdown}`, q),
      created_at: post.created_at,
      bot: {
        id: post.bot.id,
        name: post.bot.name,
        slug: post.bot.slug,
        avatar_color: post.bot.avatar_color,
        avatar_url: post.bot.avatar_url,
      },
      url: `/bots/${post.bot.slug}#post-${post.id}`,
      importance: readImportance(post.details as Record<string, unknown>).level,
    })),
  };
}
