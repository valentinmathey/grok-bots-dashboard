import "server-only";

import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Post } from "@/lib/types";

export const PUBLICACIONES_PAGE = 30;

export async function listAllPosts(options: {
  botIds?: string[];
  kind?: string;
  oldest?: boolean;
  limit: number;
}): Promise<{ posts: Post[]; total: number }> {
  if (isPreviewMode()) return { posts: [], total: 0 };
  let query = createAdminClient()
    .from("posts")
    .select("id, bot_id, title, body_markdown, kind, created_at, event_at", { count: "exact" });
  if (options.botIds?.length) query = query.in("bot_id", options.botIds);
  if (options.kind) query = query.eq("kind", options.kind);
  const { data, error, count } = await query
    .order("created_at", { ascending: Boolean(options.oldest) })
    .range(0, options.limit - 1);
  if (error) throw error;
  return { posts: (data ?? []) as Post[], total: count ?? 0 };
}
