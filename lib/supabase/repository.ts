import "server-only";

import { dayEndIso, dayStartIso, type PostFilters } from "@/lib/filters";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BotsRepository } from "@/lib/publishing";
import type { Bot, Post, PostKind } from "@/lib/types";

function applyFilters<T>(query: T, filters: PostFilters = {}): T {
  let next = query as T & {
    eq: (column: string, value: unknown) => T;
    ilike: (column: string, value: string) => T;
    contains: (column: string, value: unknown) => T;
    gte: (column: string, value: string) => T;
    lte: (column: string, value: string) => T;
  };
  if (filters.kind) {
    next = next.eq("kind", filters.kind) as typeof next;
  }
  if (filters.product) {
    next = next.ilike("product", filters.product.replace(/[%_]/g, "\\$&")) as typeof next;
  }
  if (filters.tag) {
    next = next.contains("tags", [filters.tag]) as typeof next;
  }
  if (filters.from) {
    next = next.gte("created_at", dayStartIso(filters.from)) as typeof next;
  }
  if (filters.to) {
    next = next.lte("created_at", dayEndIso(filters.to)) as typeof next;
  }
  return next;
}

function asBot(row: Bot): Bot {
  return row;
}

export function createSupabaseRepository(): BotsRepository {
  const admin = createAdminClient();

  return {
    async findBotByApiKeyHash(hash) {
      const { data, error } = await admin
        .from("bot_api_keys")
        .select("bot_id, bots!inner(id, name, slug, status)")
        .eq("key_hash", hash)
        .is("revoked_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        return null;
      }

      const bot = data.bots as unknown as {
        id: string;
        name: string;
        slug: string;
        status: string | null;
      };

      return {
        botId: bot.id,
        name: bot.name,
        slug: bot.slug,
        status: bot.status,
      };
    },

    async insertPost(input) {
      const { data, error } = await admin
        .from("posts")
        .insert({
          bot_id: input.botId,
          title: input.title,
          body_markdown: input.body,
          kind: input.kind,
          product: input.product,
          tags: input.tags,
        })
        .select("id, title, kind, product, tags, created_at")
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id as string,
        title: data.title as string,
        kind: data.kind as PostKind,
        product: (data.product as string | null) ?? null,
        tags: (data.tags as string[]) ?? [],
        created_at: data.created_at as string,
      };
    },

    async updateStatus(botId, status) {
      const { error } = await admin
        .from("bots")
        .update({
          status,
          status_updated_at: new Date().toISOString(),
        })
        .eq("id", botId);

      if (error) {
        throw error;
      }
    },

    async listBots() {
      const { data, error } = await admin
        .from("bots")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => asBot(row as Bot));
    },

    async getBotBySlug(slug) {
      const { data, error } = await admin
        .from("bots")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? asBot(data as Bot) : null;
    },

    async getBotById(id) {
      const { data, error } = await admin
        .from("bots")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? asBot(data as Bot) : null;
    },

    async listPostsByBot(botId, filters) {
      const { data, error } = await applyFilters(
        admin
          .from("posts")
          .select("*")
          .eq("bot_id", botId)
          .order("created_at", { ascending: false }),
        filters,
      );

      if (error) {
        throw error;
      }
      return (data ?? []) as Post[];
    },

    async listRecentPosts(limit, filters) {
      const { data, error } = await applyFilters(
        admin
          .from("posts")
          .select("*, bots!inner(id, name, slug)")
          .order("created_at", { ascending: false })
          .limit(limit),
        filters,
      );

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => {
        const { bots, ...post } = row as Post & {
          bots: Pick<Bot, "id" | "name" | "slug">;
        };
        return { ...(post as Post), bot: bots };
      });
    },

    async listProducts(botId) {
      let query = admin
        .from("posts")
        .select("product")
        .not("product", "is", null);
      if (botId) {
        query = query.eq("bot_id", botId);
      }
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      const seen = new Set<string>();
      const products: string[] = [];
      for (const row of data ?? []) {
        const product = typeof row.product === "string" ? row.product : null;
        if (!product) {
          continue;
        }
        const key = product.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        products.push(product);
      }
      return products.sort((a, b) => a.localeCompare(b, "es"));
    },

    async latestPostByBotIds(botIds) {
      if (botIds.length === 0) {
        return {};
      }

      const { data, error } = await admin
        .from("posts")
        .select("id, bot_id, title, kind, created_at")
        .in("bot_id", botIds)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      const latest: Record<
        string,
        Pick<Post, "id" | "title" | "kind" | "created_at">
      > = {};
      for (const row of data ?? []) {
        const botId = row.bot_id as string;
        if (!latest[botId]) {
          latest[botId] = {
            id: row.id as string,
            title: row.title as string,
            kind: row.kind as PostKind,
            created_at: row.created_at as string,
          };
        }
      }
      return latest;
    },

    async createBot(input) {
      const { data, error } = await admin
        .from("bots")
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description,
        })
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const { error: keyError } = await admin.from("bot_api_keys").insert({
        bot_id: data.id,
        key_hash: input.keyHash,
        key_prefix: input.keyPrefix,
      });

      if (keyError) {
        await admin.from("bots").delete().eq("id", data.id);
        throw keyError;
      }

      return asBot(data as Bot);
    },

    async revokeAndReplaceKey(botId, keyHash, keyPrefix) {
      const { error: revokeError } = await admin
        .from("bot_api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("bot_id", botId)
        .is("revoked_at", null);

      if (revokeError) {
        throw revokeError;
      }

      const { error } = await admin.from("bot_api_keys").insert({
        bot_id: botId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      });

      if (error) {
        throw error;
      }
    },

    async getActiveKeyPrefix(botId) {
      const { data, error } = await admin
        .from("bot_api_keys")
        .select("key_prefix")
        .eq("bot_id", botId)
        .is("revoked_at", null)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data?.key_prefix ?? null;
    },
  };
}
