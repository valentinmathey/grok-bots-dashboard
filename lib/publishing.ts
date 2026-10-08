import { generateApiKey, hashApiKey, parseBearerToken } from "@/lib/api-keys";
import { fail } from "@/lib/http";
import type { PostFilters } from "@/lib/filters";
import { normalizeProduct } from "@/lib/filters";
import { normalizeHttpUrl, normalizePostImages } from "@/lib/images";
import type {
  AuthenticatedBot,
  Bot,
  BotProfile,
  BotSummary,
  CreatedPost,
  PageOptions,
  Post,
  PostFacets,
  Result,
} from "@/lib/types";
import {
  createBotSchema,
  createPostSchema,
  formatZodError,
  listPostsQuerySchema,
  normalizeTags,
  updateProfileSchema,
  updateStatusSchema,
} from "@/lib/validations";

export type BotsRepository = {
  findBotByApiKeyHash(hash: string): Promise<AuthenticatedBot | null>;
  insertPost(input: {
    botId: string;
    title: string;
    body: string;
    kind: CreatedPost["kind"];
    product: string | null;
    tags: string[];
    cover_image_url: string | null;
    images: CreatedPost["images"];
  }): Promise<CreatedPost>;
  updateStatus(botId: string, status: string | null): Promise<void>;
  updateBotProfile(botId: string, profile: BotProfile): Promise<Bot>;
  listBots(): Promise<Bot[]>;
  listBotSummaries(): Promise<BotSummary[]>;
  getBotBySlug(slug: string): Promise<Bot | null>;
  getBotById(id: string): Promise<Bot | null>;
  listPostsByBot(botId: string, filters?: PostFilters): Promise<Post[]>;
  listPostsPage(
    botId: string,
    filters: PostFilters | undefined,
    options: PageOptions,
  ): Promise<{ posts: Post[]; total: number }>;
  listFacets(botId: string): Promise<PostFacets>;
  listRecentPosts(
    limit: number,
    filters?: PostFilters,
  ): Promise<Array<Post & { bot: Pick<Bot, "id" | "name" | "slug"> }>>;
  listProducts(botId?: string): Promise<string[]>;
  latestPostByBotIds(
    botIds: string[],
  ): Promise<Record<string, Pick<Post, "id" | "title" | "kind" | "created_at">>>;
  createBot(input: {
    name: string;
    slug: string;
    description: string | null;
    avatar_color: string | null;
    avatar_shape: string | null;
    avatar_url: string | null;
    keyHash: string;
    keyPrefix: string;
  }): Promise<Bot>;
  revokeAndReplaceKey(
    botId: string,
    keyHash: string,
    keyPrefix: string,
  ): Promise<void>;
  getActiveKeyPrefix(botId: string): Promise<string | null>;
};

export async function authenticateBot(
  repo: BotsRepository,
  authorization: string | null,
): Promise<Result<AuthenticatedBot>> {
  const token = parseBearerToken(authorization);
  if (!token) {
    return fail(
      401,
      "unauthorized",
      "Falta el header Authorization: Bearer <clave>",
    );
  }

  const bot = await repo.findBotByApiKeyHash(hashApiKey(token));
  if (!bot) {
    return fail(401, "unauthorized", "Clave de API inválida o revocada");
  }

  return { ok: true, data: bot };
}

export async function publishPost(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ post: CreatedPost; bot: AuthenticatedBot }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }

  const parsed = createPostSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los datos de la publicación no son válidos",
      formatZodError(parsed.error),
    );
  }

  const post = await repo.insertPost({
    botId: auth.data.botId,
    title: parsed.data.title,
    body: parsed.data.body,
    kind: parsed.data.kind,
    product: normalizeProduct(parsed.data.product),
    tags: normalizeTags(parsed.data.tags),
    cover_image_url: normalizeHttpUrl(parsed.data.cover_image_url),
    images: normalizePostImages(parsed.data.images),
  });

  return { ok: true, status: 201, data: { post, bot: auth.data } };
}

export async function publishStatus(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ bot: AuthenticatedBot; status: string | null }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }

  const parsed = updateStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "El estado no es válido",
      formatZodError(parsed.error),
    );
  }

  const status = parsed.data.status.trim() ? parsed.data.status.trim() : null;
  await repo.updateStatus(auth.data.botId, status);

  return {
    ok: true,
    data: {
      bot: { ...auth.data, status },
      status,
    },
  };
}

export async function createOwnedBot(
  repo: BotsRepository,
  payload: unknown,
): Promise<Result<{ bot: Bot; api_key: string }>> {
  const parsed = createBotSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los datos del bot no son válidos",
      formatZodError(parsed.error),
    );
  }

  const existing = await repo.getBotBySlug(parsed.data.slug);
  if (existing) {
    return fail(409, "slug_taken", "Ya existe un bot con ese slug");
  }

  const generated = generateApiKey();
  const bot = await repo.createBot({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    avatar_color: parsed.data.avatar_color ?? null,
    avatar_shape: parsed.data.avatar_shape ?? null,
    avatar_url: normalizeHttpUrl(parsed.data.avatar_url),
    keyHash: generated.hash,
    keyPrefix: generated.prefix,
  });

  return {
    ok: true,
    status: 201,
    data: { bot, api_key: generated.key },
  };
}

export async function listMyPosts(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ posts: Post[]; bot: AuthenticatedBot }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }

  const parsed = listPostsQuerySchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los filtros no son válidos",
      formatZodError(parsed.error),
    );
  }

  const posts = await repo.listPostsByBot(auth.data.botId, {
    product: parsed.data.product || undefined,
    kind: parsed.data.kind,
    from: parsed.data.from,
    to: parsed.data.to,
    tag: parsed.data.tag
      ? parsed.data.tag.replace(/^#/, "").toLowerCase()
      : undefined,
  });

  return {
    ok: true,
    data: {
      bot: auth.data,
      posts: posts.slice(0, parsed.data.limit),
    },
  };
}

export async function updateOwnedProfile(
  repo: BotsRepository,
  botId: string,
  payload: unknown,
): Promise<Result<{ bot: Bot }>> {
  const bot = await repo.getBotById(botId);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese bot");
  }
  const parsed = updateProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "El perfil no es válido",
      formatZodError(parsed.error),
    );
  }
  const next = await repo.updateBotProfile(botId, {
    description:
      parsed.data.description !== undefined
        ? parsed.data.description.trim() || null
        : (bot.description ?? null),
    avatar_color:
      parsed.data.avatar_color !== undefined
        ? parsed.data.avatar_color
        : (bot.avatar_color ?? null),
    avatar_shape:
      parsed.data.avatar_shape !== undefined
        ? parsed.data.avatar_shape
        : (bot.avatar_shape ?? null),
    avatar_url:
      parsed.data.avatar_url !== undefined
        ? normalizeHttpUrl(parsed.data.avatar_url)
        : (bot.avatar_url ?? null),
  });
  return { ok: true, data: { bot: next } };
}

export async function updateBotProfile(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ bot: AuthenticatedBot & BotProfile }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  const parsed = updateProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "El perfil no es válido",
      formatZodError(parsed.error),
    );
  }
  const current = await repo.getBotById(auth.data.botId);
  if (!current) {
    return fail(404, "not_found", "No encontramos ese bot");
  }
  const next = await repo.updateBotProfile(auth.data.botId, {
    description:
      parsed.data.description !== undefined
        ? parsed.data.description.trim() || null
        : (current.description ?? null),
    avatar_color:
      parsed.data.avatar_color !== undefined
        ? parsed.data.avatar_color
        : (current.avatar_color ?? null),
    avatar_shape:
      parsed.data.avatar_shape !== undefined
        ? parsed.data.avatar_shape
        : (current.avatar_shape ?? null),
    avatar_url:
      parsed.data.avatar_url !== undefined
        ? normalizeHttpUrl(parsed.data.avatar_url)
        : (current.avatar_url ?? null),
  });
  return {
    ok: true,
    data: {
      bot: {
        ...auth.data,
        description: next.description,
        avatar_color: next.avatar_color ?? null,
        avatar_shape: next.avatar_shape ?? null,
        avatar_url: next.avatar_url ?? null,
      },
    },
  };
}

export async function regenerateOwnedKey(
  repo: BotsRepository,
  botId: string,
): Promise<Result<{ api_key: string; key_prefix: string; bot: Bot }>> {
  const bot = await repo.getBotById(botId);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese bot");
  }

  const generated = generateApiKey();
  await repo.revokeAndReplaceKey(bot.id, generated.hash, generated.prefix);

  return {
    ok: true,
    data: {
      api_key: generated.key,
      key_prefix: generated.prefix,
      bot,
    },
  };
}
