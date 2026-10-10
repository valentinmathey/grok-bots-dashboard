import { randomBytes } from "node:crypto";
import { hashApiKey } from "@/lib/api-keys";
import { SUMMARY_BOT_SLUG } from "@/lib/details";
import { getSiteUrl } from "@/lib/env";
import { fail } from "@/lib/http";
import {
  authenticateBot,
  requireWrite,
  type BotsRepository,
} from "@/lib/publishing";
import type { Bot, Post, Result, ShareLink } from "@/lib/types";
import { isPostId, slugSchema, formatZodError } from "@/lib/validations";
import { z } from "zod";

export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;

export type ShareLinkPublic = {
  id: string;
  bot: { id: string; slug: string; name: string };
  token_prefix: string;
  created_at: string;
  revoked_at: string | null;
};

export function generateShareToken(): {
  token: string;
  hash: string;
  prefix: string;
} {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashApiKey(token),
    prefix: token.slice(0, 8),
  };
}

export function hashShareToken(token: string): string {
  return hashApiKey(token);
}

export function isShareToken(value: string): boolean {
  return SHARE_TOKEN_RE.test(value.trim());
}

export function shareUrl(token: string): string {
  return `${getSiteUrl()}/compartir/${token}`;
}

async function requireShareAdmin(
  repo: BotsRepository,
  authorization: string | null,
) {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  const write = requireWrite(auth.data);
  if (!write.ok) {
    return write;
  }
  if (auth.data.slug !== SUMMARY_BOT_SLUG) {
    return fail(
      403,
      "forbidden",
      `Solo ${SUMMARY_BOT_SLUG} puede crear o revocar links para compartir`,
    );
  }
  return auth;
}

function toPublic(link: ShareLink, bot: Bot): ShareLinkPublic {
  return {
    id: link.id,
    bot: { id: bot.id, slug: bot.slug, name: bot.name },
    token_prefix: link.token_prefix,
    created_at: link.created_at,
    revoked_at: link.revoked_at,
  };
}

export async function resolveShare(
  repo: BotsRepository,
  token: string,
): Promise<Result<{ link: ShareLink; bot: Bot }>> {
  const raw = token.trim();
  if (!isShareToken(raw)) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  const link = await repo.findShareLinkByTokenHash(hashShareToken(raw));
  if (!link || link.revoked_at) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  const bot = await repo.getBotById(link.bot_id);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  return { ok: true, data: { link, bot } };
}

export async function resolveSharedPost(
  repo: BotsRepository,
  token: string,
  postId: string,
): Promise<Result<{ link: ShareLink; bot: Bot; post: Post }>> {
  const share = await resolveShare(repo, token);
  if (!share.ok) {
    return share;
  }
  if (!isPostId(postId)) {
    return fail(404, "not_found", "No encontramos esa publicación");
  }
  const post = await repo.getPostById(postId.trim());
  if (!post || post.bot_id !== share.data.bot.id) {
    return fail(404, "not_found", "No encontramos esa publicación");
  }
  return { ok: true, data: { ...share.data, post } };
}

const createSchema = z.object({
  bot_slug: slugSchema,
});

const revokeSchema = z
  .object({
    bot_slug: slugSchema.optional(),
    id: z.string().trim().uuid().optional(),
  })
  .refine((value) => Boolean(value.bot_slug || value.id), {
    message: "Mandá bot_slug o id",
  });

const listSchema = z.object({
  bot_slug: slugSchema.optional(),
});

export async function createShareLink(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<
  Result<{
    url: string;
    id: string;
    token_prefix: string;
    created_at: string;
    bot: { id: string; slug: string; name: string };
  }>
> {
  const auth = await requireShareAdmin(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  const parsed = createSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Falta el slug del bot",
      formatZodError(parsed.error),
    );
  }
  const bot = await repo.getBotBySlug(parsed.data.bot_slug);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese bot");
  }
  const generated = generateShareToken();
  const link = await repo.insertShareLink({
    botId: bot.id,
    tokenHash: generated.hash,
    tokenPrefix: generated.prefix,
  });
  return {
    ok: true,
    status: 201,
    data: {
      url: shareUrl(generated.token),
      id: link.id,
      token_prefix: link.token_prefix,
      created_at: link.created_at,
      bot: { id: bot.id, slug: bot.slug, name: bot.name },
    },
  };
}

export async function revokeShareLink(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ revoked: number }>> {
  const auth = await requireShareAdmin(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  const parsed = revokeSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Mandá bot_slug o id",
      formatZodError(parsed.error),
    );
  }
  if (parsed.data.id) {
    const revoked = await repo.revokeShareLink(parsed.data.id);
    if (!revoked) {
      return fail(404, "not_found", "No encontramos ese link");
    }
    return { ok: true, data: { revoked: revoked.revoked_at ? 1 : 0 } };
  }
  const bot = await repo.getBotBySlug(parsed.data.bot_slug as string);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese bot");
  }
  const count = await repo.revokeShareLinksByBot(bot.id);
  return { ok: true, data: { revoked: count } };
}

export async function listShareLinks(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ links: ShareLinkPublic[] }>> {
  const auth = await requireShareAdmin(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  const parsed = listSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los filtros no son válidos",
      formatZodError(parsed.error),
    );
  }
  let botId: string | undefined;
  if (parsed.data.bot_slug) {
    const bot = await repo.getBotBySlug(parsed.data.bot_slug);
    if (!bot) {
      return fail(404, "not_found", "No encontramos ese bot");
    }
    botId = bot.id;
  }
  const links = await repo.listShareLinks(botId);
  const bots = new Map<string, Bot>();
  const publicLinks: ShareLinkPublic[] = [];
  for (const link of links) {
    let bot = bots.get(link.bot_id);
    if (!bot) {
      bot = (await repo.getBotById(link.bot_id)) ?? undefined;
      if (bot) bots.set(link.bot_id, bot);
    }
    if (bot) {
      publicLinks.push(toPublic(link, bot));
    }
  }
  return { ok: true, data: { links: publicLinks } };
}
