"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FilterSheet } from "@/components/FilterSheet";
import { PostCard } from "@/components/PostCard";
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
}: {
  slug: string;
  query: FeedQuery;
  initialPosts: Post[];
  total: number;
  facets: PostFacets;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const lock = useRef(false);
  const path = `/bots/${slug}`;

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
      params.set("slug", slug);
      const response = await fetch(`/api/admin/posts?${params}`);
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
  }, [posts.length, query, slug]);

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
        <div className="flex rounded-full bg-chip p-1">
          <Link
            href={`${path}?${filtersToSearchParams({ ...query, when: "upcoming" }).toString()}`}
            className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium ${
              when === "upcoming" ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Próximos
          </Link>
          <Link
            href={`${path}?${filtersToSearchParams({ ...query, when: "past" }).toString()}`}
            className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium ${
              when === "past" ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Ya pasaron
          </Link>
        </div>
      ) : null}
      <FilterSheet action={path} facets={facets} query={query} />
      {posts.length === 0 ? (
        <EmptyState
          title={
            hasActiveFilters(query)
              ? "Nada con esos filtros"
              : when === "upcoming"
                ? "No hay eventos próximos"
                : when === "past"
                  ? "Todavía no hay eventos pasados"
                  : "Sin publicaciones"
          }
          body={
            hasActiveFilters(query)
              ? "Probá otro producto, tipo o rango de fechas."
              : when === "upcoming"
                ? "Cuando haya un evento con fecha, aparece acá."
                : when === "past"
                  ? "Los eventos que ya ocurrieron se listan acá."
                  : "Cuando este bot publique, los posts aparecen acá."
          }
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} filterBasePath={path} />
          ))}
          {posts.length < total ? (
            <div ref={sentinel} className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => void loadMore()}
                className="text-sm font-medium text-accent"
                disabled={loading}
              >
                {loading ? "Cargando…" : "Cargar más"}
              </button>
            </div>
          ) : (
            <p className="pb-4 text-center text-xs text-muted">
              {total} {total === 1 ? "publicación" : "publicaciones"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
