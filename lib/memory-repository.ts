import { matchesFilters, type PostFilters } from "@/lib/filters";
import type { BotsRepository } from "@/lib/publishing";
import type { Bot, Post, PostKind } from "@/lib/types";

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
    };
    this.posts.unshift(post);
    return {
      id: post.id,
      title: post.title,
      kind: post.kind,
      product: post.product,
      tags: post.tags,
      created_at: post.created_at,
    };
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
