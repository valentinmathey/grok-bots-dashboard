"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  return (
    <div className="min-w-0 space-y-4">
      <FilterSheet action={path} facets={facets} query={query} />
      {posts.length === 0 ? (
        <EmptyState
          title={hasActiveFilters(query) ? "Nada con esos filtros" : "Sin publicaciones"}
          body={
            hasActiveFilters(query)
              ? "Probá otro producto, tipo o rango de fechas."
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
