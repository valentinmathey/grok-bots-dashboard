"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ItemFav = { post_id: string; item_key: string; label?: string | null };

type Ctx = {
  postIds: Set<string>;
  items: ItemFav[];
  togglePost: (postId: string) => Promise<void>;
  toggleItem: (input: {
    post_id: string;
    item_key: string;
    label?: string;
    url?: string;
    price_at_save?: number;
  }) => Promise<void>;
  isItemSaved: (postId: string, key: string) => boolean;
  registeredIds: Set<string>;
  toggleRegistered: (postId: string) => Promise<void>;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [postIds, setPostIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ItemFav[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetch("/api/admin/registrations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { post_ids?: string[] } | null) => {
        if (data?.post_ids) setRegisteredIds(new Set(data.post_ids));
      })
      .catch(() => undefined);
  }, []);

  const toggleRegistered = useCallback(
    async (postId: string) => {
      const on = !registeredIds.has(postId);
      setRegisteredIds((prev) => {
        const next = new Set(prev);
        if (on) next.add(postId);
        else next.delete(postId);
        return next;
      });
      await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, registered: on }),
      });
    },
    [registeredIds],
  );

  useEffect(() => {
    void fetch("/api/admin/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { posts?: Array<{ post_id: string }>; items?: ItemFav[] } | null) => {
        if (!data) return;
        setPostIds(new Set((data.posts ?? []).map((row) => row.post_id)));
        setItems(data.items ?? []);
      });
  }, []);

  const togglePost = useCallback(async (postId: string) => {
    setPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    await fetch("/api/admin/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
  }, []);

  const toggleItem = useCallback(async (input: {
    post_id: string;
    item_key: string;
    label?: string;
    url?: string;
    price_at_save?: number;
  }) => {
    setItems((prev) => {
      const exists = prev.some((row) => row.post_id === input.post_id && row.item_key === input.item_key);
      if (exists) return prev.filter((row) => !(row.post_id === input.post_id && row.item_key === input.item_key));
      return [...prev, { post_id: input.post_id, item_key: input.item_key, label: input.label }];
    });
    await fetch("/api/admin/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      postIds,
      items,
      togglePost,
      toggleItem,
      isItemSaved: (postId, key) => items.some((row) => row.post_id === postId && row.item_key === key),
      registeredIds,
      toggleRegistered,
    }),
    [postIds, items, togglePost, toggleItem, registeredIds, toggleRegistered],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      postIds: new Set<string>(),
      items: [] as ItemFav[],
      togglePost: async () => undefined,
      toggleItem: async () => undefined,
      isItemSaved: () => false,
      registeredIds: new Set<string>(),
      toggleRegistered: async () => undefined,
    };
  }
  return ctx;
}
