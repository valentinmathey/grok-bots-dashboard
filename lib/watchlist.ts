import "server-only";

import { z } from "zod";
import { fail } from "@/lib/http";
import { authenticateBot, type BotsRepository } from "@/lib/publishing";
import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatZodError } from "@/lib/validations";
import type { Result } from "@/lib/types";
import {
  WATCHLIST_STATUSES,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/lib/watchlist-shared";

export { WATCHLIST_STATUSES, type WatchlistItem, type WatchlistStatus };

export const createWatchlistSchema = z
  .object({
    bot_id: z.string().uuid().or(z.string().min(1).max(64)),
    name: z.string().trim().min(1).max(160),
    target_price: z.number().min(0).max(1_000_000_000).nullable().optional(),
    notes: z.string().trim().max(280).optional(),
    status: z.enum(WATCHLIST_STATUSES).optional(),
  })
  .strict();

export const updateWatchlistSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(160).optional(),
    target_price: z.number().min(0).max(1_000_000_000).nullable().optional(),
    status: z.enum(WATCHLIST_STATUSES).optional(),
    notes: z.string().trim().max(280).optional(),
  })
  .strict();

const memory: WatchlistItem[] = [];

export async function listWatchlist(
  botId: string,
  status?: WatchlistStatus,
): Promise<WatchlistItem[]> {
  if (isPreviewMode())
    return memory.filter(
      (i) => i.bot_id === botId && (!status || i.status === status),
    );
  let query = createAdminClient()
    .from("watchlist_items")
    .select("*")
    .eq("bot_id", botId)
    .order("created_at");
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as WatchlistItem[]).map((row) => ({
    ...row,
    target_price: row.target_price == null ? null : Number(row.target_price),
  }));
}

export async function createWatchlistItem(
  input: z.infer<typeof createWatchlistSchema>,
): Promise<WatchlistItem> {
  const now = new Date().toISOString();
  const row = {
    bot_id: input.bot_id,
    name: input.name,
    target_price: input.target_price ?? null,
    notes: input.notes ?? "",
    status: (input.status ?? "siguiendo") as WatchlistStatus,
  };
  if (isPreviewMode()) {
    const item = {
      ...row,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    memory.push(item);
    return item;
  }
  const { data, error } = await createAdminClient()
    .from("watchlist_items")
    .insert(row)
    .select("*")
    .single();
  if (error) throw error;
  return data as WatchlistItem;
}

export async function updateWatchlistItem(
  input: z.infer<typeof updateWatchlistSchema>,
): Promise<WatchlistItem | null> {
  const { id, ...rest } = input;
  const patch = { ...rest, updated_at: new Date().toISOString() };
  if (isPreviewMode()) {
    const item = memory.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, patch);
    return item;
  }
  const { data, error } = await createAdminClient()
    .from("watchlist_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return (data as WatchlistItem | null) ?? null;
}

export async function deleteWatchlistItem(id: string): Promise<void> {
  if (isPreviewMode()) {
    const i = memory.findIndex((x) => x.id === id);
    if (i >= 0) memory.splice(i, 1);
    return;
  }
  const { error } = await createAdminClient()
    .from("watchlist_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

const listArgs = z
  .object({ status: z.enum(WATCHLIST_STATUSES).optional() })
  .strict();

/** MCP list_watchlist: productos que el dueño cargó para este bot, con el source_id a usar en su ranking. */
export async function botListWatchlist(
  repo: BotsRepository,
  authorization: string | null,
  args: unknown,
): Promise<
  Result<{ items: Array<WatchlistItem & { ranking_source_id: string }> }>
> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  const parsed = listArgs.safeParse(args ?? {});
  if (!parsed.success)
    return fail(
      400,
      "invalid_input",
      "Argumentos inválidos",
      formatZodError(parsed.error),
    );
  const items = await listWatchlist(auth.data.botId, parsed.data.status);
  return {
    ok: true,
    data: {
      items: items.map((item) => ({
        ...item,
        ranking_source_id: `watch:${item.id}`,
      })),
    },
  };
}
