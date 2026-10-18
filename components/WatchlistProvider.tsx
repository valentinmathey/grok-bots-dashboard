"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  matchesWatchItem,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/lib/watchlist-shared";

type WatchlistCtx = {
  items: WatchlistItem[];
  error: string | null;
  pending: boolean;
  add(input: {
    name: string;
    target_price?: number | null;
    status?: WatchlistStatus;
  }): Promise<WatchlistItem | null>;
  patch(id: string, change: Partial<WatchlistItem>): Promise<void>;
  remove(id: string): Promise<void>;
  findFor(sourceId: unknown, productName: unknown): WatchlistItem | undefined;
};

const Ctx = createContext<WatchlistCtx | null>(null);

async function api(method: string, body?: unknown, query = "") {
  const res = await fetch(`/api/admin/watchlist${query}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => null))?.error?.message ?? "Error",
    );
  return res.json();
}

export function WatchlistProvider({
  botId,
  initialItems,
  children,
}: {
  botId: string;
  initialItems: WatchlistItem[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const add = useCallback<WatchlistCtx["add"]>(
    async (input) => {
      setPending(true);
      try {
        const { item } = await api("POST", { bot_id: botId, ...input });
        setItems((prev) => [...prev, item]);
        setError(null);
        return item as WatchlistItem;
      } catch (e) {
        setError((e as Error).message);
        return null;
      } finally {
        setPending(false);
      }
    },
    [botId],
  );

  const patch = useCallback<WatchlistCtx["patch"]>(async (id, change) => {
    let before: WatchlistItem[] = [];
    setItems((prev) => {
      before = prev;
      return prev.map((i) => (i.id === id ? { ...i, ...change } : i));
    });
    try {
      await api("PATCH", { id, ...change });
      setError(null);
    } catch (e) {
      setItems(before);
      setError((e as Error).message);
    }
  }, []);

  const remove = useCallback<WatchlistCtx["remove"]>(async (id) => {
    let before: WatchlistItem[] = [];
    setItems((prev) => {
      before = prev;
      return prev.filter((i) => i.id !== id);
    });
    try {
      await api("DELETE", undefined, `?id=${encodeURIComponent(id)}`);
    } catch (e) {
      setItems(before);
      setError((e as Error).message);
    }
  }, []);

  const value = useMemo<WatchlistCtx>(
    () => ({
      items,
      error,
      pending,
      add,
      patch,
      remove,
      findFor: (sourceId, productName) =>
        items.find((i) => sourceId === `watch:${i.id}`) ??
        items.find((i) => matchesWatchItem(i, sourceId, productName)),
    }),
    [items, error, pending, add, patch, remove],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWatchlist() {
  return useContext(Ctx);
}
