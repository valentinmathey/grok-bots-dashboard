import { matchesFilters, type PostFilters } from "@/lib/filters";
import type { BotsRepository } from "@/lib/publishing";
import type { Bot, BotProfile, BotSummary, PageOptions, Post, PostFacets, PostKind } from "@/lib/types";

type StoredKey = {
  botId: string;
  hash: string;
  prefix: string;
  revokedAt: string | null;
};

export class MemoryRepository implements BotsRepository {
  bots: Bot[] = [];
  posts: Post[] = [];
  keys: StoredKey[] = [];

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
  }) {
    const post: Post = {
      id: `post_${this.posts.length + 1}`,
      bot_id: input.botId,
      title: input.title,
      body_markdown: input.body,
      kind: input.kind,
      product: input.product,
      tags: input.tags,
      created_at: new Date().toISOString(),
      cover_image_url: input.cover_image_url,
      images: input.images ?? [],
    };
    this.posts.unshift(post);
    return {
      id: post.id,
      title: post.title,
      kind: post.kind,
      product: post.product,
      tags: post.tags,
      created_at: post.created_at,
      cover_image_url: post.cover_image_url,
      images: post.images,
    };
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
        return {
          ...bot,
          post_count: posts.length,
          last_activity_at: last?.created_at ?? bot.status_updated_at,
          latest_title: last?.title ?? null,
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
    const ordered =
      options.sort === "oldest" ? [...matched].reverse() : matched;
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
    };
  }

  async listRecentPosts(limit: number, filters: PostFilters = {}) {
    return this.posts
      .filter((post) => matchesFilters(post, filters))
      .slice(0, limit)
      .flatMap((post) => {
        const bot = this.bots.find((item) => item.id === post.bot_id);
        if (!bot) {
          return [];
        }
        return [{ ...post, bot: { id: bot.id, name: bot.name, slug: bot.slug } }];
      });
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
    });
    return bot;
  }

  async revokeAndReplaceKey(botId: string, keyHash: string, keyPrefix: string) {
    const now = new Date().toISOString();
    this.keys.forEach((key) => {
      if (key.botId === botId && !key.revokedAt) {
        key.revokedAt = now;
      }
    });
    this.keys.push({
      botId,
      hash: keyHash,
      prefix: keyPrefix,
      revokedAt: null,
    });
  }

  async getActiveKeyPrefix(botId: string) {
    return (
      this.keys.find((key) => key.botId === botId && !key.revokedAt)?.prefix ??
      null
    );
  }
}
