import "server-only";

import { collectAlojamientoFacets, collectOportunidadesFacets } from "@/lib/details";
import { baEndOfDay, baStartOfDay, baStartOfToday, eventSortAscending } from "@/lib/event-time";
import {
  dayEndIso,
  dayStartIso,
  hasAlojamientoFilters, hasImportanceFilters,
  hasOportunidadesFilters,
  isAlojamientoSort,
  isOportunidadesSort,
  matchesFilters,
  sortPosts,
  type PostFilters,
} from "@/lib/filters";
import { canWrite, normalizeScopes } from "@/lib/scopes";
import {
  SUMMARY_EVENT_HORIZON_DAYS,
  SUMMARY_LOOKBACK_DAYS,
} from "@/lib/summary";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BotsRepository } from "@/lib/publishing";
import type { Bot, BotSummary, Post, PostImage, PostKind, ShareLink } from "@/lib/types";
import { isPostId } from "@/lib/validations";

type RegistrationFilters = PostFilters & { registeredIds?: string[] };

async function withRegistrationIds(filters?: PostFilters): Promise<RegistrationFilters | undefined> {
  if (!filters?.registered) return filters;
  const { listRegisteredIds } = await import("@/lib/registrations-store");
  return { ...filters, registeredIds: await listRegisteredIds() };
}

function applyFilters<T>(query: T, filters: RegistrationFilters = {}): T {
  let next = query as T & {
    eq: (column: string, value: unknown) => T;
    ilike: (column: string, value: string) => T;
    contains: (column: string, value: unknown) => T;
    gte: (column: string, value: string) => T;
    lte: (column: string, value: string) => T;
    lt: (column: string, value: string) => T;
    not: (column: string, op: string, value: unknown) => T;
    or: (value: string) => T;
  };
  if (filters.kind) {
    next = next.eq("kind", filters.kind) as typeof next;
  }
  if (filters.registered && filters.registeredIds) {
    const ids = filters.registeredIds;
    if (filters.registered === "si") {
      next = (next as unknown as { in: (c: string, v: string[]) => T }).in(
        "id",
        ids.length ? ids : ["00000000-0000-0000-0000-000000000000"],
      ) as typeof next;
    } else if (ids.length) {
      next = next.not("id", "in", `(${ids.join(",")})`) as typeof next;
    }
  }
  if (filters.product) {
    next = next.ilike("product", filters.product.replace(/[%_]/g, "\\$&")) as typeof next;
  }
  if (filters.tag) {
    next = next.contains("tags", [filters.tag]) as typeof next;
  }

  const now = new Date();
  const startToday = baStartOfToday(now).toISOString();
  const wantUpcoming = filters.when === "upcoming" || filters.upcoming === true;
  const wantPast = filters.when === "past" || filters.upcoming === false;

  if (filters.eventsOnly || wantUpcoming || wantPast) {
    next = next.not("event_at", "is", null) as typeof next;
  }
  if (wantUpcoming) {
    next = next.or(
      `event_at.gte.${startToday},event_end_at.gte.${now.toISOString()}`,
    ) as typeof next;
  }
  if (wantPast) {
    next = next.lt("event_at", startToday) as typeof next;
    next = next.or(
      `event_end_at.is.null,event_end_at.lt.${now.toISOString()}`,
    ) as typeof next;
  }

  const dateColumn = filters.dateBasis === "event" ? "event_at" : "created_at";
  const fromIso =
    filters.dateBasis === "event" && filters.from
      ? baStartOfDay(filters.from).toISOString()
      : filters.from
        ? dayStartIso(filters.from)
        : undefined;
  const toIso =
    filters.dateBasis === "event" && filters.to
      ? baEndOfDay(filters.to).toISOString()
      : filters.to
        ? dayEndIso(filters.to)
        : undefined;
  if (fromIso) {
    next = next.gte(dateColumn, fromIso) as typeof next;
  }
  if (toIso) {
    next = next.lte(dateColumn, toIso) as typeof next;
  }
  if (filters.event_from) {
    next = next.gte("event_at", baStartOfDay(filters.event_from).toISOString()) as typeof next;
  }
  if (filters.event_to) {
    next = next.lte("event_at", baEndOfDay(filters.event_to).toISOString()) as typeof next;
  }
  return next;
}

function asBot(row: Bot): Bot {
  return { ...row, sort_order: row.sort_order ?? 0 };
}

async function nextUpcomingByBotIds(
  admin: ReturnType<typeof createAdminClient>,
  botIds: string[],
): Promise<Record<string, { title: string; event_at: string }>> {
  if (botIds.length === 0) {
    return {};
  }
  const now = new Date();
  const startToday = baStartOfToday(now).toISOString();
  const { data, error } = await admin
    .from("posts")
    .select("bot_id, title, event_at, event_end_at")
    .in("bot_id", botIds)
    .not("event_at", "is", null)
    .or(`event_at.gte.${startToday},event_end_at.gte.${now.toISOString()}`)
    .order("event_at", { ascending: true })
    .limit(400);

  if (error) {
    return {};
  }

  const next: Record<string, { title: string; event_at: string }> = {};
  for (const row of data ?? []) {
    const botId = row.bot_id as string;
    if (!next[botId] && row.event_at) {
      next[botId] = {
        title: row.title as string,
        event_at: row.event_at as string,
      };
    }
  }
  return next;
}

export function createSupabaseRepository(): BotsRepository {
  const admin = createAdminClient();

  return {
    async findBotByApiKeyHash(hash) {
      const { data, error } = await admin
        .from("bot_api_keys")
        .select("bot_id, scopes, bots!inner(id, name, slug, status)")
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
        scopes: normalizeScopes(data.scopes as string[] | null),
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
          event_at: input.event_at,
          event_end_at: input.event_end_at,
          details: input.details ?? {},
        })
        .select("id, title, kind, product, tags, created_at, updated_at, cover_image_url, images, event_at, event_end_at, details")
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
        updated_at: (data.updated_at as string | null) ?? (data.created_at as string),
        cover_image_url: (data.cover_image_url as string | null) ?? null,
        images: (data.images as PostImage[] | null) ?? [],
        event_at: (data.event_at as string | null) ?? null,
        event_end_at: (data.event_end_at as string | null) ?? null,
        details: (data.details as Record<string, unknown> | null) ?? {},
      };
    },

    async getPostById(id) {
      if (!isPostId(id)) {
        return null;
      }
      const { data, error } = await admin
        .from("posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? (data as Post) : null;
    },

    async findPostBySourceId(botId, sourceId) {
      const { data, error } = await admin
        .from("posts")
        .select("*")
        .eq("bot_id", botId)
        .eq("details->>source_id", sourceId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Post | null) ?? null;
    },

    async updatePost(id, patch) {
      const fields: Record<string, unknown> = {};
      if (patch.title !== undefined) fields.title = patch.title;
      if (patch.body !== undefined) fields.body_markdown = patch.body;
      if (patch.kind !== undefined) fields.kind = patch.kind;
      if (patch.product !== undefined) fields.product = patch.product;
      if (patch.tags !== undefined) fields.tags = patch.tags;
      if (patch.cover_image_url !== undefined) fields.cover_image_url = patch.cover_image_url;
      if (patch.images !== undefined) fields.images = patch.images;
      if (patch.event_at !== undefined) fields.event_at = patch.event_at;
      if (patch.event_end_at !== undefined) fields.event_end_at = patch.event_end_at;
      if (patch.details !== undefined) fields.details = patch.details;
      const { data, error } = await admin
        .from("posts")
        .update(fields)
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return data as Post;
    },

    async deletePost(id) {
      const { error } = await admin.from("posts").delete().eq("id", id);
      if (error) {
        throw error;
      }
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
      const ordered = await admin
        .from("bots")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      const { data, error } = ordered.error
        ? await admin.from("bots").select("*").order("name", { ascending: true })
        : ordered;

      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => asBot(row as Bot));
    },

    async listBotSummaries() {
      const { data, error } = await admin
        .from("bot_home")
        .select("*")
        .order("sort_order", { ascending: true })
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
      const nextEvents = await nextUpcomingByBotIds(
        admin,
        summaries.map((bot) => bot.id),
      );
      return summaries.map((bot) => ({
        ...bot,
        latest_title: latest[bot.id]?.title ?? bot.latest_title,
        next_event_at: nextEvents[bot.id]?.event_at ?? bot.next_event_at ?? null,
        next_event_title: nextEvents[bot.id]?.title ?? bot.next_event_title ?? null,
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

    async listPostsPage(botId, rawFilters, options) {
      const filters = await withRegistrationIds(rawFilters);
      const limit = options.limit ?? 12;
      const offset = options.offset ?? 0;
      const needsJs =
        isAlojamientoSort(options.sort) ||
        hasAlojamientoFilters(filters) ||
        hasImportanceFilters(filters) ||
        isOportunidadesSort(options.sort) ||
        hasOportunidadesFilters(filters);
      if (needsJs) {
        const { data, error } = await applyFilters(
          admin.from("posts").select("*").eq("bot_id", botId),
          filters,
        );
        if (error) {
          throw error;
        }
        const matched = ((data ?? []) as Post[]).filter((post) =>
          matchesFilters(post, filters ?? {}),
        );
        const ordered = sortPosts(
          matched,
          options.sort ?? "newest",
          filters?.when,
          filters,
        );
        return {
          posts: ordered.slice(offset, offset + limit),
          total: ordered.length,
        };
      }
      const scope = filters?.when;
      const ascending = scope
        ? eventSortAscending(options.sort === "oldest" ? "oldest" : "newest", scope)
        : options.sort === "oldest";
      const sortColumn = scope ? "event_at" : "created_at";
      const filtered = applyFilters(
        admin
          .from("posts")
          .select("*", { count: "exact" })
          .eq("bot_id", botId),
        filters,
      );
      const { data, error, count } = await filtered
        .order(sortColumn, { ascending, nullsFirst: false })
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
        .select("kind, product, tags, event_at, details")
        .eq("bot_id", botId);

      if (error) {
        throw error;
      }

      const products = new Map<string, string>();
      const kinds = new Set<string>();
      const tags = new Set<string>();
      let hasEvents = false;
      for (const row of data ?? []) {
        if (typeof row.kind === "string" && row.kind) kinds.add(row.kind);
        if (typeof row.product === "string" && row.product) {
          const key = row.product.toLowerCase();
          if (!products.has(key)) products.set(key, row.product);
        }
        for (const tag of (row.tags as string[] | null) ?? []) {
          if (tag) tags.add(tag);
        }
        if (row.event_at) hasEvents = true;
      }
      const rows = (data ?? []) as Array<{
        kind?: string;
        details?: unknown;
      }>;
      return {
        products: [...products.values()].sort((a, b) => a.localeCompare(b, "es")),
        kinds: [...kinds].sort(),
        tags: [...tags].sort(),
        has_events: hasEvents,
        has_alojamientos: rows.some((row) => row.kind === "alojamiento"),
        has_oportunidades: rows.some((row) => row.kind === "oportunidades"),
        ...collectAlojamientoFacets(rows),
        ...collectOportunidadesFacets(rows),
      };
    },

    async listPostsForSummary(now = new Date()) {
      const since = new Date(
        now.getTime() - SUMMARY_LOOKBACK_DAYS * 86_400_000,
      ).toISOString();
      const today = baStartOfToday(now).toISOString();
      const horizon = new Date(
        now.getTime() + SUMMARY_EVENT_HORIZON_DAYS * 86_400_000,
      ).toISOString();
      const { data, error } = await admin
        .from("posts")
        .select("*")
        .or(
          `created_at.gte.${since},and(event_at.gte.${today},event_at.lte.${horizon})`,
        )
        .order("created_at", { ascending: false })
        .limit(800);
      if (error) {
        throw error;
      }
      return (data ?? []) as Post[];
    },

    async listRecentPosts(limit, filters) {
      let query = admin
        .from("posts")
        .select("*, bots!inner(id, name, slug)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filters?.bot) {
        query = query.eq("bots.slug", filters.bot);
      }
      const { data, error } = await applyFilters(query, filters);

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

    async listCatalogPosts(filters, options) {
      let query = admin
        .from("posts")
        .select("*, bots!inner(id, name, slug)", { count: "exact" });
      if (filters.bot) {
        query = query.eq("bots.slug", filters.bot);
      }
      if (filters.q) {
        const needle = filters.q.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
        if (needle) {
          query = query.or(
            `title.ilike.%${needle}%,body_markdown.ilike.%${needle}%`,
          );
        }
      }
      const filtered = applyFilters(query, filters);
      const ordered = options.sortEvents
        ? filtered.order("event_at", { ascending: true, nullsFirst: false })
        : filtered.order("created_at", { ascending: false });
      const { data, error, count } = await ordered.range(
        options.offset,
        options.offset + options.limit - 1,
      );

      if (error) {
        throw error;
      }

      return {
        posts: (data ?? []).map((row) => {
          const { bots, ...post } = row as Post & {
            bots: Pick<Bot, "id" | "name" | "slug">;
          };
          return { ...(post as Post), bot: bots };
        }),
        total: count ?? 0,
      };
    },

    async listStatsPosts(days = 90) {
      const lookback = days <= 0 ? 3650 : days;
      const since = new Date(Date.now() - lookback * 86_400_000).toISOString();
      const { data, error } = await admin
        .from("posts")
        .select("*, bots!inner(id, name, slug, avatar_color, avatar_url)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { bots, ...post } = row as import("@/lib/types").Post & {
          bots: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
        };
        return { ...(post as import("@/lib/types").Post), bot: bots };
      });
    },

    async listAgendaPosts() {
      const { data, error } = await admin
        .from("posts")
        .select("*, bots!inner(id, name, slug, avatar_color, avatar_url)")
        .or("event_at.not.is.null,kind.eq.oportunidades,kind.eq.alojamiento")
        .order("created_at", { ascending: false })
        .limit(800);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { bots, ...post } = row as import("@/lib/types").Post & {
          bots: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
        };
        return { ...(post as import("@/lib/types").Post), bot: bots };
      });
    },

    async searchPosts(filters) {
      const { highlightSnippet, memorySearch } = await import("@/lib/search");
      const { readImportance } = await import("@/lib/importance");
      const q = filters.q.trim();
      const { searchUiHasAdvanced } = await import("@/lib/search-filters");
      const hasScope = Boolean(
        filters.kinds?.length ||
          filters.from ||
          filters.to ||
          filters.bots?.length ||
          filters.importance?.length ||
          (filters.ui && searchUiHasAdvanced(filters.ui)),
      );
      if (q.length < 2 && !hasScope) return { hits: [], total: 0 };
      const useMemory = Boolean(
        filters.importance?.length ||
          (filters.ui && searchUiHasAdvanced(filters.ui)),
      );
      if (useMemory) {
        const fallback = await admin
          .from("posts")
          .select("*, bots!inner(id, name, slug, avatar_color, avatar_url)");
        const rows = (fallback.data ?? []).map((row) => {
          const { bots, ...post } = row as Post & {
            bots: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
          };
          return { ...(post as Post), bot: bots };
        });
        return memorySearch(rows, filters);
      }
      const limit = Math.min(filters.limit ?? 20, 50);
      const offset = filters.offset ?? 0;
      let query = admin
        .from("posts")
        .select("*, bots!inner(id, name, slug, avatar_color, avatar_url)", { count: "exact" });
      if (filters.bots?.length) {
        query = query.in("bots.slug", filters.bots);
      }
      if (filters.kinds?.length) {
        query = query.in("kind", filters.kinds);
      }
      if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00.000Z`);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
      // search_tsv se guarda sin acentos: normalizamos la consulta igual.
      const ts = q
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[':()&|!]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      let built = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (ts.length >= 2) {
        built = query
          .textSearch("search_tsv", ts, { type: "websearch", config: "simple" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
      }
      let { data, error, count } = await built;
      if (error) {
        const fallback = await admin
          .from("posts")
          .select("*, bots!inner(id, name, slug, avatar_color, avatar_url)");
        const rows = (fallback.data ?? []).map((row) => {
          const { bots, ...post } = row as Post & {
            bots: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
          };
          return { ...(post as Post), bot: bots };
        });
        return memorySearch(rows, filters);
      }
      const hits = (data ?? []).map((row) => {
        const { bots, ...post } = row as Post & {
          bots: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
        };
        return {
          id: post.id,
          title: post.title,
          kind: post.kind,
          snippet: highlightSnippet(`${post.title}. ${post.body_markdown}`, q),
          created_at: post.created_at,
          bot: bots,
          url: `/bots/${bots.slug}#post-${post.id}`,
          importance: readImportance(post.details as Record<string, unknown>).level,
        };
      });
      if (filters.sort !== "newest") {
        hits.sort((a, b) => (a.title.toLowerCase().includes(q.toLowerCase()) ? -1 : 1) - (b.title.toLowerCase().includes(q.toLowerCase()) ? -1 : 1));
      }
      return { hits, total: count ?? hits.length };
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

    async reorderBots(ids) {
      const unique = [...new Set(ids.filter(Boolean))];
      await Promise.all(
        unique.map((id, index) =>
          admin.from("bots").update({ sort_order: index, updated_at: new Date().toISOString() }).eq("id", id),
        ),
      );
      return this.listBots();
    },

    async createBot(input) {
      const { data: last } = await admin
        .from("bots")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await admin
        .from("bots")
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description,
          avatar_color: input.avatar_color,
          avatar_shape: input.avatar_shape,
          avatar_url: input.avatar_url,
          sort_order: (typeof last?.sort_order === "number" ? last.sort_order : -1) + 1,
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
        .is("revoked_at", null)
        .contains("scopes", ["publish"]);

      if (revokeError) {
        throw revokeError;
      }

      const { error } = await admin.from("bot_api_keys").insert({
        bot_id: botId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: ["publish"],
      });

      if (error) {
        throw error;
      }
    },

    async getActiveKeyPrefix(botId) {
      const { data, error } = await admin
        .from("bot_api_keys")
        .select("key_prefix, scopes")
        .eq("bot_id", botId)
        .is("revoked_at", null);

      if (error) {
        throw error;
      }
      const rows = (data ?? []) as Array<{ key_prefix: string; scopes?: string[] }>;
      const publish = rows.find((row) => canWrite(row.scopes));
      return (publish ?? rows[0])?.key_prefix ?? null;
    },

    async insertShareLink(input) {
      const { data, error } = await admin
        .from("bot_share_links")
        .insert({
          bot_id: input.botId,
          scope: input.scope ?? "bot",
          bot_ids: input.botIds ?? null,
          token_hash: input.tokenHash,
          token_prefix: input.tokenPrefix,
        })
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return data as ShareLink;
    },

    async findShareLinkByTokenHash(hash) {
      const { data, error } = await admin
        .from("bot_share_links")
        .select("*")
        .eq("token_hash", hash)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? (data as ShareLink) : null;
    },

    async revokeShareLink(id) {
      const { data, error } = await admin
        .from("bot_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id)
        .is("revoked_at", null)
        .select("*")
        .maybeSingle();
      if (error) {
        throw error;
      }
      if (data) {
        return data as ShareLink;
      }
      const existing = await admin
        .from("bot_share_links")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (existing.error) {
        throw existing.error;
      }
      return existing.data ? (existing.data as ShareLink) : null;
    },

    async revokeShareLinksByBot(botId) {
      const { data, error } = await admin
        .from("bot_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("bot_id", botId)
        .is("revoked_at", null)
        .select("id");
      if (error) {
        throw error;
      }
      return (data ?? []).length;
    },

    async listShareLinks(botId) {
      let query = admin
        .from("bot_share_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (botId) {
        query = query.eq("bot_id", botId);
      }
      const { data, error } = await query;
      if (error) {
        throw error;
      }
      return (data ?? []) as ShareLink[];
    },
  };
}
