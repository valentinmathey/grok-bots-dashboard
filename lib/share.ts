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
  scope: "bot" | "audios";
  bot: { id: string; slug: string; name: string } | null;
  bots?: Array<{ id: string; slug: string; name: string }> | null;
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

function toPublic(
  link: ShareLink,
  bot: Bot | null,
  bots?: Bot[] | null,
): ShareLinkPublic {
  return {
    id: link.id,
    scope: link.scope ?? "bot",
    bot: bot ? { id: bot.id, slug: bot.slug, name: bot.name } : null,
    bots: bots ? bots.map((b) => ({ id: b.id, slug: b.slug, name: b.name })) : null,
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
  if (!link || link.revoked_at || (link.scope ?? "bot") !== "bot" || !link.bot_id) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  const bot = await repo.getBotById(link.bot_id);
  if (!bot) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  return { ok: true, data: { link, bot } };
}

/** Link de la sección Audios (scope 'audios'). bot_ids null = todos los bots. */
export async function resolveAudiosShare(
  repo: BotsRepository,
  token: string,
): Promise<Result<{ link: ShareLink; botIds: string[] | null }>> {
  const raw = token.trim();
  if (!isShareToken(raw)) {
    return fail(404, "not_found", "No encontramos ese link");
  }
  const link = await repo.findShareLinkByTokenHash(hashShareToken(raw));
  if (!link || link.revoked_at || link.scope !== "audios") {
    return fail(404, "not_found", "No encontramos ese link");
  }
  return { ok: true, data: { link, botIds: link.bot_ids?.length ? link.bot_ids : null } };
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

const createSchema = z
  .object({
    scope: z.enum(["bot", "audios"]).optional(),
    bot_slug: slugSchema.optional(),
    bot_slugs: z.array(slugSchema).max(20).optional(),
  })
  .refine((v) => (v.scope === "audios" ? !v.bot_slug : Boolean(v.bot_slug)), {
    message: "Mandá bot_slug, o scope 'audios' (con bot_slugs opcional)",
  });

const revokeSchema = z
  .object({
    bot_slug: slugSchema.optional(),
    id: z.string().trim().uuid().optional(),
    scope: z.enum(["audios"]).optional(),
  })
  .refine((value) => Boolean(value.bot_slug || value.id || value.scope), {
    message: "Mandá bot_slug, id o scope 'audios'",
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
    scope: "bot" | "audios";
    bot: { id: string; slug: string; name: string } | null;
    bots?: Array<{ id: string; slug: string; name: string }> | null;
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
  if (parsed.data.scope === "audios") {
    const bots: Bot[] = [];
    for (const slug of parsed.data.bot_slugs ?? []) {
      const found = await repo.getBotBySlug(slug);
      if (!found) return fail(404, "not_found", `No encontramos el bot ${slug}`);
      bots.push(found);
    }
    const gen = generateShareToken();
    const audiosLink = await repo.insertShareLink({
      botId: null,
      scope: "audios",
      botIds: bots.length ? bots.map((b) => b.id) : null,
      tokenHash: gen.hash,
      tokenPrefix: gen.prefix,
    });
    return {
      ok: true,
      status: 201,
      data: {
        url: shareUrl(gen.token),
        id: audiosLink.id,
        token_prefix: audiosLink.token_prefix,
        created_at: audiosLink.created_at,
        scope: "audios",
        bot: null,
        bots: bots.length ? bots.map((b) => ({ id: b.id, slug: b.slug, name: b.name })) : null,
      },
    };
  }
  const bot = await repo.getBotBySlug(parsed.data.bot_slug as string);
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
      scope: "bot",
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
  if (!parsed.data.bot_slug && parsed.data.scope === "audios") {
    let count = 0;
    for (const link of await repo.listShareLinks()) {
      if (link.scope === "audios" && !link.revoked_at && (await repo.revokeShareLink(link.id))) count += 1;
    }
    return { ok: true, data: { revoked: count } };
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
    if (link.scope === "audios" || !link.bot_id) {
      if (botId) continue;
      const scoped: Bot[] = [];
      for (const id of link.bot_ids ?? []) {
        const found = bots.get(id) ?? (await repo.getBotById(id)) ?? undefined;
        if (found) {
          bots.set(id, found);
          scoped.push(found);
        }
      }
      publicLinks.push(toPublic(link, null, link.bot_ids?.length ? scoped : null));
      continue;
    }
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
