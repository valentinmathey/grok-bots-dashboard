"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { AlojamientoTable } from "@/components/AlojamientoTable";
import { EmptyState } from "@/components/EmptyState";
import { SegmentedControl } from "@/components/FilterChip";
import { FilterSheet } from "@/components/FilterSheet";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/Skeleton";
import {
  PAGE_SIZE,
  filtersToSearchParams,
  hasActiveFilters,
  type FeedQuery,
} from "@/lib/filters";
import type { Post, PostFacets } from "@/lib/types";

export function PostFeed({
  slug,
  query,
  initialPosts,
  total,
  facets,
  basePath,
  postsApi,
  postHrefBase,
}: {
  slug: string;
  query: FeedQuery;
  initialPosts: Post[];
  total: number;
  facets: PostFacets;
  basePath?: string;
  postsApi?: string;
  /** Base de la URL de detalle (ej. /compartir/<token>). String para poder pasarlo desde un Server Component. */
  postHrefBase?: string;
}) {
  const postHref = postHrefBase
    ? (post: Post) => `${postHrefBase}/${post.id}`
    : undefined;
  const [posts, setPosts] = useState(initialPosts);
  const [hashPostId, setHashPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const lock = useRef(false);
  const path = basePath ?? `/bots/${slug}`;
  const alojamiento = facets.has_alojamientos && !facets.has_events;
  const oportunidades = facets.has_oportunidades && !facets.has_events && !alojamiento;
  const view = query.view === "table" && alojamiento ? "table" : "cards";

  const loadMore = useCallback(async () => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setLoading(true);
    try {
      const params = filtersToSearchParams(query);
      params.set("offset", String(posts.length));
      params.set("limit", String(PAGE_SIZE));
      if (!postsApi) {
        params.set("slug", slug);
      }
      const response = await fetch(`${postsApi ?? "/api/admin/posts"}?${params}`);
      const payload = (await response.json()) as { posts?: Post[] };
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        const extra = (payload.posts ?? []).filter((post) => !seen.has(post.id));
        return [...current, ...extra];
      });
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }, [posts.length, postsApi, query, slug]);

  useEffect(() => {
    function applyHash() {
      const raw = window.location.hash;
      const id = raw.startsWith("#post-") ? raw.slice(6) : null;
      setHashPostId(id);
      if (!id) return;
      requestAnimationFrame(() => {
        document.getElementById(`post-${id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || posts.length >= total) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, posts.length, total]);

  const hasEvents = facets.has_events;
  const when = query.when ?? (hasEvents ? "upcoming" : undefined);

  return (
    <div className="min-w-0 space-y-4">
      {hasEvents ? (
        <SegmentedControl
          value={when === "past" ? "past" : "upcoming"}
          options={[
            {
              id: "upcoming",
              label: "Próximos",
              href: `${path}?${filtersToSearchParams({ ...query, when: "upcoming" }).toString()}`,
            },
            {
              id: "past",
              label: "Ya pasaron",
              href: `${path}?${filtersToSearchParams({ ...query, when: "past" }).toString()}`,
            },
          ]}
        />
      ) : null}
      <FilterSheet action={path} facets={facets} query={query} />
      {alojamiento ? (
        <SegmentedControl
          value={view === "table" ? "table" : "cards"}
          options={[
            {
              id: "cards",
              label: (
                <>
                  <LayoutGrid size={14} strokeWidth={1.75} />
                  Cards
                </>
              ),
              href: `${path}?${filtersToSearchParams({ ...query, view: "cards" }).toString()}`,
            },
            {
              id: "table",
              label: (
                <>
                  <Table2 size={14} strokeWidth={1.75} />
                  Comparar
                </>
              ),
              href: `${path}?${filtersToSearchParams({ ...query, view: "table" }).toString()}`,
            },
          ]}
        />
      ) : null}
      {posts.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters(query)
              ? "Nada con esos filtros"
              : when === "upcoming"
                ? "No hay eventos próximos"
                : when === "past"
                  ? "Todavía no hay eventos pasados"
                  : alojamiento
                    ? "Sin alojamientos"
                    : oportunidades
                      ? "Sin oportunidades"
                      : "Sin publicaciones"
          }
          body={
            hasActiveFilters(query)
              ? oportunidades
                ? "Probá otra categoría o sacá los filtros."
                : "Probá otra ciudad, precio o amenity."
              : when === "upcoming"
                ? "Cuando haya un evento con fecha, aparece acá."
                : when === "past"
                  ? "Los eventos que ya ocurrieron se listan acá."
                  : alojamiento
                    ? "Cuando este bot publique un alojamiento, aparece acá."
                    : oportunidades
                      ? "Cuando este bot publique un lote, aparece acá."
                      : "Cuando este bot publique, los posts aparecen acá."
          }
        />
      ) : view === "table" ? (
        <AlojamientoTable
          posts={posts}
          postHref={postHref}
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              filterBasePath={path}
              href={postHref?.(post)}
              query={query}
              defaultOpen={post.id === hashPostId}
            />
          ))}
        </div>
      )}
      {posts.length > 0 && posts.length < total ? (
        <div ref={sentinel} className="flex justify-center py-4">
          {loading ? (
            <div className="w-full space-y-3">
              <PostCardSkeleton />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="text-sm font-medium text-accent"
            >
              Cargar más
            </button>
          )}
        </div>
      ) : posts.length > 0 ? (
        <p className="pb-4 text-center text-xs text-muted">
          {total} {total === 1 ? "publicación" : "publicaciones"}
        </p>
      ) : null}
    </div>
  );
}
