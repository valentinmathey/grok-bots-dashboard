import "server-only";

import { dayEndIso, dayStartIso, type PostFilters } from "@/lib/filters";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BotsRepository } from "@/lib/publishing";
import type { Bot, BotSummary, Post, PostImage, PostKind } from "@/lib/types";

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
          cover_image_url: input.cover_image_url,
          images: input.images ?? [],
        })
        .select("id, title, kind, product, tags, created_at, cover_image_url, images")
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
        cover_image_url: (data.cover_image_url as string | null) ?? null,
        images: (data.images as PostImage[] | null) ?? [],
      };
    },

    async updateBotProfile(botId, profile) {
      const { data, error } = await admin
        .from("bots")
        .update({
          description: profile.description,
          avatar_color: profile.avatar_color,
          avatar_shape: profile.avatar_shape,
          avatar_url: profile.avatar_url,
        })
        .eq("id", botId)
        .select("*")
        .single();

      if (error) {
        throw error;
      }
      return asBot(data as Bot);
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

    async listBotSummaries() {
      const { data, error } = await admin
        .from("bot_home")
        .select("*")
        .order("name", { ascending: true });

      let summaries: BotSummary[];

      if (!error && data) {
        summaries = data.map((row) => ({
          ...(row as Bot),
          post_count: Number(row.post_count ?? 0),
          last_activity_at: (row.last_activity_at as string | null) ?? null,
          latest_title: (row.latest_title as string | null) ?? null,
        }));
      } else {
        const bots = await this.listBots();
        const { data: posts } = await admin
          .from("posts")
          .select("bot_id, title, created_at")
          .order("created_at", { ascending: false });
        const counts = new Map<
          string,
          { post_count: number; last_activity_at: string | null; latest_title: string | null }
        >();
        for (const row of posts ?? []) {
          const botId = row.bot_id as string;
          const current = counts.get(botId);
          if (!current) {
            counts.set(botId, {
              post_count: 1,
              last_activity_at: row.created_at as string,
              latest_title: (row.title as string | null) ?? null,
            });
          } else {
            current.post_count += 1;
          }
        }
        summaries = bots.map((bot) => ({
          ...bot,
          post_count: counts.get(bot.id)?.post_count ?? 0,
          last_activity_at: counts.get(bot.id)?.last_activity_at ?? null,
          latest_title: counts.get(bot.id)?.latest_title ?? null,
        }));
      }

      const latest = await this.latestPostByBotIds(summaries.map((bot) => bot.id));
      return summaries.map((bot) => ({
        ...bot,
        latest_title: latest[bot.id]?.title ?? bot.latest_title,
      }));
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

    async listPostsPage(botId, filters, options) {
      const limit = options.limit ?? 12;
      const offset = options.offset ?? 0;
      const ascending = options.sort === "oldest";
      const filtered = applyFilters(
        admin
          .from("posts")
          .select("*", { count: "exact" })
          .eq("bot_id", botId),
        filters,
      );
      const { data, error, count } = await filtered
        .order("created_at", { ascending })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }
      return {
        posts: (data ?? []) as Post[],
        total: count ?? 0,
      };
    },

    async listFacets(botId) {
      const { data, error } = await admin
        .from("posts")
        .select("kind, product, tags")
        .eq("bot_id", botId);

      if (error) {
        throw error;
      }

      const products = new Map<string, string>();
      const kinds = new Set<string>();
      const tags = new Set<string>();
      for (const row of data ?? []) {
        if (typeof row.kind === "string" && row.kind) kinds.add(row.kind);
        if (typeof row.product === "string" && row.product) {
          const key = row.product.toLowerCase();
          if (!products.has(key)) products.set(key, row.product);
        }
        for (const tag of (row.tags as string[] | null) ?? []) {
          if (tag) tags.add(tag);
        }
      }
      return {
        products: [...products.values()].sort((a, b) => a.localeCompare(b, "es")),
        kinds: [...kinds].sort(),
        tags: [...tags].sort(),
      };
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
          avatar_color: input.avatar_color,
          avatar_shape: input.avatar_shape,
          avatar_url: input.avatar_url,
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
