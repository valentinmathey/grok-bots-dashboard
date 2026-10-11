import "server-only";

import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type Favorite = {
  post_id: string;
  created_at: string;
  note: string | null;
};

export type ItemFavorite = {
  id: string;
  post_id: string;
  item_key: string;
  label: string | null;
  url: string | null;
  price_at_save: number | null;
  created_at: string;
};

const memory = {
  posts: [] as Favorite[],
  items: [] as ItemFavorite[],
};

export async function favoriteIdSet(): Promise<Set<string>> {
  try {
    return new Set((await listFavorites()).map((row) => row.post_id));
  } catch {
    return new Set();
  }
}

export async function listFavorites(): Promise<Favorite[]> {
  if (isPreviewMode()) return [...memory.posts].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const admin = createAdminClient();
  const { data, error } = await admin.from("post_favorites").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Favorite[];
}

export async function listItemFavorites(): Promise<ItemFavorite[]> {
  if (isPreviewMode()) return [...memory.items];
  const admin = createAdminClient();
  const { data, error } = await admin.from("post_item_favorites").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ItemFavorite[];
}

export async function toggleFavorite(postId: string, note?: string | null): Promise<{ saved: boolean }> {
  if (isPreviewMode()) {
    const idx = memory.posts.findIndex((row) => row.post_id === postId);
    if (idx >= 0) {
      memory.posts.splice(idx, 1);
      return { saved: false };
    }
    memory.posts.push({
      post_id: postId,
      created_at: new Date().toISOString(),
      note: note ?? null,
    });
    return { saved: true };
  }
  const admin = createAdminClient();
  const { data: existing } = await admin.from("post_favorites").select("post_id").eq("post_id", postId).maybeSingle();
  if (existing) {
    await admin.from("post_favorites").delete().eq("post_id", postId);
    return { saved: false };
  }
  await admin.from("post_favorites").insert({ post_id: postId, note: note ?? null });
  return { saved: true };
}

export async function setFavoriteNote(postId: string, note: string | null) {
  if (isPreviewMode()) {
    const row = memory.posts.find((item) => item.post_id === postId);
    if (row) row.note = note;
    return;
  }
  const admin = createAdminClient();
  await admin.from("post_favorites").update({ note }).eq("post_id", postId);
}

export async function toggleItemFavorite(input: {
  post_id: string;
  item_key: string;
  label?: string;
  url?: string;
  price_at_save?: number;
}): Promise<{ saved: boolean }> {
  if (isPreviewMode()) {
    const idx = memory.items.findIndex(
      (row) => row.post_id === input.post_id && row.item_key === input.item_key,
    );
    if (idx >= 0) {
      memory.items.splice(idx, 1);
      return { saved: false };
    }
    memory.items.push({
      id: `ifav_${memory.items.length + 1}`,
      post_id: input.post_id,
      item_key: input.item_key,
      label: input.label ?? null,
      url: input.url ?? null,
      price_at_save: input.price_at_save ?? null,
      created_at: new Date().toISOString(),
    });
    return { saved: true };
  }
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("post_item_favorites")
    .select("id")
    .eq("post_id", input.post_id)
    .eq("item_key", input.item_key)
    .maybeSingle();
  if (existing) {
    await admin.from("post_item_favorites").delete().eq("id", existing.id);
    return { saved: false };
  }
  await admin.from("post_item_favorites").insert({
    post_id: input.post_id,
    item_key: input.item_key,
    label: input.label ?? null,
    url: input.url ?? null,
    price_at_save: input.price_at_save ?? null,
  });
  return { saved: true };
}
