import { collectAlojamientoFacets, emptyDetails } from "@/lib/details";
import { isEventUpcoming } from "@/lib/event-time";
import { matchesFilters, sortPosts, type PostFilters } from "@/lib/filters";
import type { BotsRepository } from "@/lib/publishing";
import { baStartOfToday } from "@/lib/event-time";
import { canWrite, normalizeScopes } from "@/lib/scopes";
import { SUMMARY_EVENT_HORIZON_DAYS, SUMMARY_LOOKBACK_DAYS } from "@/lib/summary";
import type { Bot, BotProfile, BotSummary, PageOptions, Post, PostFacets, PostKind, ShareLink } from "@/lib/types";

type StoredKey = {
  botId: string;
  hash: string;
  prefix: string;
  revokedAt: string | null;
  scopes?: string[];
};

export class MemoryRepository implements BotsRepository {
  bots: Bot[] = [];
  posts: Post[] = [];
  keys: StoredKey[] = [];
  shareLinks: ShareLink[] = [];

  async findBotByApiKeyHash(hash: string) {
    const key = this.keys.find((item) => item.hash === hash && !item.revokedAt);
    if (!key) {
      return null;
    }
    const bot = this.bots.find((item) => item.id === key.botId);
    if (!bot) {
      return null;
    }
    return {
      botId: bot.id,
      name: bot.name,
      slug: bot.slug,
      status: bot.status,
      scopes: normalizeScopes(key.scopes),
    };
  }

  async insertPost(input: {
    botId: string;
    title: string;
    body: string;
    kind: PostKind;
    product: string | null;
    tags: string[];
    cover_image_url: string | null;
    images: Post["images"];
    event_at: string | null;
    event_end_at: string | null;
    details?: Record<string, unknown>;
  }) {
    const post: Post = {
      id: crypto.randomUUID(),
      bot_id: input.botId,
      title: input.title,
      body_markdown: input.body,
      kind: input.kind,
      product: input.product,
      tags: input.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cover_image_url: input.cover_image_url,
      images: input.images ?? [],
      event_at: input.event_at,
      event_end_at: input.event_end_at,
      details: input.details ?? emptyDetails(),
    };
    this.posts.unshift(post);
    return {
      id: post.id,
      title: post.title,
      kind: post.kind,
      product: post.product,
      tags: post.tags,
      created_at: post.created_at,
      updated_at: post.updated_at,
      cover_image_url: post.cover_image_url,
      images: post.images,
      event_at: post.event_at,
      event_end_at: post.event_end_at,
      details: post.details ?? emptyDetails(),
    };
  }

  async getPostById(id: string) {
    return this.posts.find((post) => post.id === id) ?? null;
  }

  async updatePost(
    id: string,
    patch: {
      title?: string;
      body?: string;
      kind?: PostKind;
      product?: string | null;
      tags?: string[];
      cover_image_url?: string | null;
      images?: Post["images"];
      event_at?: string | null;
      event_end_at?: string | null;
      details?: Record<string, unknown>;
    },
  ) {
    const post = this.posts.find((item) => item.id === id);
    if (!post) {
      throw new Error("post not found");
    }
    if (patch.title !== undefined) post.title = patch.title;
    if (patch.body !== undefined) post.body_markdown = patch.body;
    if (patch.kind !== undefined) post.kind = patch.kind;
    if (patch.product !== undefined) post.product = patch.product;
    if (patch.tags !== undefined) post.tags = patch.tags;
    if (patch.cover_image_url !== undefined) post.cover_image_url = patch.cover_image_url;
    if (patch.images !== undefined) post.images = patch.images;
    if (patch.event_at !== undefined) post.event_at = patch.event_at;
    if (patch.event_end_at !== undefined) post.event_end_at = patch.event_end_at;
    if (patch.details !== undefined) post.details = patch.details;
    post.updated_at = new Date().toISOString();
    return post;
  }

  async deletePost(id: string) {
    this.posts = this.posts.filter((post) => post.id !== id);
  }

  async updateBotProfile(botId: string, profile: BotProfile) {
    const bot = this.bots.find((item) => item.id === botId);
    if (!bot) {
      throw new Error("bot not found");
    }
    bot.description = profile.description;
    bot.avatar_color = profile.avatar_color;
    bot.avatar_shape = profile.avatar_shape;
    bot.avatar_url = profile.avatar_url;
    bot.updated_at = new Date().toISOString();
    return bot;
  }

  async updateStatus(botId: string, status: string | null) {
    const bot = this.bots.find((item) => item.id === botId);
    if (bot) {
      bot.status = status;
      bot.status_updated_at = new Date().toISOString();
      bot.updated_at = bot.status_updated_at;
    }
  }

  async listBots() {
    return [...this.bots];
  }

  async listBotSummaries(): Promise<BotSummary[]> {
    return this.bots
      .map((bot) => {
        const posts = this.posts.filter((post) => post.bot_id === bot.id);
        const last = posts.reduce<Post | null>((best, post) => {
          if (!best) return post;
          return new Date(post.created_at) > new Date(best.created_at) ? post : best;
        }, null);
        const nextEvent = posts
          .filter((post) => isEventUpcoming(post))
          .sort(
            (a, b) =>
              new Date(a.event_at ?? 0).getTime() - new Date(b.event_at ?? 0).getTime(),
          )[0];
        return {
          ...bot,
          post_count: posts.length,
          last_activity_at: last?.created_at ?? bot.status_updated_at,
          latest_title: last?.title ?? null,
          next_event_at: nextEvent?.event_at ?? null,
          next_event_title: nextEvent?.title ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  async getBotBySlug(slug: string) {
    return this.bots.find((bot) => bot.slug === slug) ?? null;
  }

  async getBotById(id: string) {
    return this.bots.find((bot) => bot.id === id) ?? null;
  }

  async listPostsByBot(botId: string, filters: PostFilters = {}) {
    return this.posts.filter(
      (post) => post.bot_id === botId && matchesFilters(post, filters),
    );
  }

  async listPostsPage(
    botId: string,
    filters: PostFilters | undefined,
    options: PageOptions,
  ) {
    const matched = this.posts.filter(
      (post) => post.bot_id === botId && matchesFilters(post, filters ?? {}),
    );
    const ordered = sortPosts(matched, options.sort ?? "newest", filters?.when);
    const offset = options.offset ?? 0;
    const limit = options.limit ?? ordered.length;
    return {
      posts: ordered.slice(offset, offset + limit),
      total: ordered.length,
    };
  }

  async listFacets(botId: string): Promise<PostFacets> {
    const products = new Map<string, string>();
    const kinds = new Set<string>();
    const tags = new Set<string>();
    for (const post of this.posts) {
      if (post.bot_id !== botId) continue;
      if (post.product) {
        const key = post.product.toLowerCase();
        if (!products.has(key)) products.set(key, post.product);
      }
      if (post.kind) kinds.add(post.kind);
      for (const tag of post.tags) tags.add(tag);
    }
    return {
      products: [...products.values()].sort((a, b) => a.localeCompare(b, "es")),
      kinds: [...kinds].sort(),
      tags: [...tags].sort(),
      has_events: this.posts.some((post) => post.bot_id === botId && Boolean(post.event_at)),
      has_alojamientos: this.posts.some(
        (post) => post.bot_id === botId && post.kind === "alojamiento",
      ),
      ...collectAlojamientoFacets(this.posts.filter((post) => post.bot_id === botId)),
    };
  }

  async listPostsForSummary(now = new Date()) {
    const since = now.getTime() - SUMMARY_LOOKBACK_DAYS * 86_400_000;
    const today = baStartOfToday(now).getTime();
    const horizon = now.getTime() + SUMMARY_EVENT_HORIZON_DAYS * 86_400_000;
    return this.posts.filter((post) => {
      const created = new Date(post.created_at).getTime();
      if (created >= since && created <= now.getTime()) {
        return true;
      }
      if (!post.event_at) {
        return false;
      }
      const start = new Date(post.event_at).getTime();
      return start >= today && start <= horizon;
    });
  }

  async listRecentPosts(limit: number, filters: PostFilters = {}) {
    const botId = filters.bot
      ? this.bots.find((item) => item.slug === filters.bot)?.id
      : undefined;
    if (filters.bot && !botId) {
      return [];
    }
    return this.posts
      .filter(
        (post) =>
          (!botId || post.bot_id === botId) && matchesFilters(post, filters),
      )
      .slice(0, limit)
      .flatMap((post) => {
        const bot = this.bots.find((item) => item.id === post.bot_id);
        if (!bot) {
          return [];
        }
        return [{ ...post, bot: { id: bot.id, name: bot.name, slug: bot.slug } }];
      });
  }

  async listCatalogPosts(
    filters: PostFilters,
    options: { limit: number; offset: number; sortEvents: boolean },
  ) {
    const botId = filters.bot
      ? this.bots.find((item) => item.slug === filters.bot)?.id
      : undefined;
    if (filters.bot && !botId) {
      return { posts: [], total: 0 };
    }
    const matched = this.posts.filter(
      (post) =>
        (!botId || post.bot_id === botId) && matchesFilters(post, filters),
    );
    const sorted = options.sortEvents
      ? sortPosts(matched, "newest", filters.upcoming === false ? "past" : "upcoming")
      : sortPosts(matched, "newest");
    const page = sorted.slice(options.offset, options.offset + options.limit);
    return {
      posts: page.flatMap((post) => {
        const bot = this.bots.find((item) => item.id === post.bot_id);
        if (!bot) return [];
        return [{ ...post, bot: { id: bot.id, name: bot.name, slug: bot.slug } }];
      }),
      total: matched.length,
    };
  }

  async listProducts(botId?: string) {
    const seen = new Set<string>();
    const products: string[] = [];
    for (const post of this.posts) {
      if (botId && post.bot_id !== botId) {
        continue;
      }
      if (!post.product) {
        continue;
      }
      const key = post.product.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      products.push(post.product);
    }
    return products.sort((a, b) => a.localeCompare(b, "es"));
  }

  async latestPostByBotIds(botIds: string[]) {
    const latest: Awaited<ReturnType<BotsRepository["latestPostByBotIds"]>> = {};
    for (const post of this.posts) {
      if (botIds.includes(post.bot_id) && !latest[post.bot_id]) {
        latest[post.bot_id] = {
          id: post.id,
          title: post.title,
          kind: post.kind,
          created_at: post.created_at,
        };
      }
    }
    return latest;
  }

  async createBot(input: {
    name: string;
    slug: string;
    description: string | null;
    avatar_color: string | null;
    avatar_shape: string | null;
    avatar_url: string | null;
    keyHash: string;
    keyPrefix: string;
  }) {
    const now = new Date().toISOString();
    const bot: Bot = {
      id: `bot_${this.bots.length + 1}`,
      name: input.name,
      slug: input.slug,
      description: input.description,
      status: null,
      status_updated_at: null,
      avatar_color: input.avatar_color,
      avatar_shape: input.avatar_shape,
      avatar_url: input.avatar_url,
      created_at: now,
      updated_at: now,
    };
    this.bots.push(bot);
    this.keys.push({
      botId: bot.id,
      hash: input.keyHash,
      prefix: input.keyPrefix,
      revokedAt: null,
      scopes: ["publish"],
    });
    return bot;
  }

  async revokeAndReplaceKey(botId: string, keyHash: string, keyPrefix: string) {
    const now = new Date().toISOString();
    this.keys.forEach((key) => {
      if (key.botId === botId && !key.revokedAt && canWrite(key.scopes)) {
        key.revokedAt = now;
      }
    });
    this.keys.push({
      botId,
      hash: keyHash,
      prefix: keyPrefix,
      revokedAt: null,
      scopes: ["publish"],
    });
  }

  async getActiveKeyPrefix(botId: string) {
    const active = this.keys.filter((key) => key.botId === botId && !key.revokedAt);
    const publish = active.find((key) => canWrite(key.scopes));
    return (publish ?? active[0])?.prefix ?? null;
  }

  async insertShareLink(input: {
    botId: string;
    tokenHash: string;
    tokenPrefix: string;
  }) {
    const link: ShareLink = {
      id: crypto.randomUUID(),
      bot_id: input.botId,
      token_hash: input.tokenHash,
      token_prefix: input.tokenPrefix,
      created_at: new Date().toISOString(),
      revoked_at: null,
    };
    this.shareLinks.unshift(link);
    return link;
  }

  async findShareLinkByTokenHash(hash: string) {
    return this.shareLinks.find((link) => link.token_hash === hash) ?? null;
  }

  async revokeShareLink(id: string) {
    const link = this.shareLinks.find((item) => item.id === id);
    if (!link) {
      return null;
    }
    if (!link.revoked_at) {
      link.revoked_at = new Date().toISOString();
    }
    return link;
  }

  async revokeShareLinksByBot(botId: string) {
    const now = new Date().toISOString();
    let count = 0;
    for (const link of this.shareLinks) {
      if (link.bot_id === botId && !link.revoked_at) {
        link.revoked_at = now;
        count += 1;
      }
    }
    return count;
  }

  async listShareLinks(botId?: string) {
    return this.shareLinks.filter((link) => !botId || link.bot_id === botId);
  }
}
