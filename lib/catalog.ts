import { getSiteUrl } from "@/lib/env";
import { addCalendarDays, baCalendarDate } from "@/lib/event-time";
import type { PostFilters } from "@/lib/filters";
import { fail } from "@/lib/http";
import { authenticateBot, type BotsRepository } from "@/lib/publishing";
import { canReadAll } from "@/lib/scopes";
import type { AuthenticatedBot, Bot, Post, Result } from "@/lib/types";
import {
  catalogEventsQuerySchema,
  catalogPostsQuerySchema,
  formatZodError,
} from "@/lib/validations";

export type CatalogPost = {
  id: string;
  bot: { slug: string; name: string };
  kind: string;
  title: string;
  body: string;
  product: string | null;
  tags: string[];
  event_at: string | null;
  event_end_at: string | null;
  cover_image_url: string | null;
  url: string;
  created_at: string;
  details: Record<string, unknown> | null;
};

export function usesEventSort(filters: {
  upcoming?: boolean;
  event_from?: string;
  event_to?: string;
}): boolean {
  return (
    filters.upcoming !== undefined ||
    Boolean(filters.event_from) ||
    Boolean(filters.event_to)
  );
}

export function toCatalogPost(
  post: Post & { bot: Pick<Bot, "name" | "slug"> },
): CatalogPost {
  return {
    id: post.id,
    bot: { slug: post.bot.slug, name: post.bot.name },
    kind: post.kind,
    title: post.title,
    body: post.body_markdown,
    product: post.product,
    tags: post.tags,
    event_at: post.event_at ?? null,
    event_end_at: post.event_end_at ?? null,
    cover_image_url: post.cover_image_url ?? null,
    url: `${getSiteUrl()}/bots/${post.bot.slug}`,
    created_at: post.created_at,
    details: (post.details as Record<string, unknown> | null) ?? {},
  };
}

function parseOffset(cursor?: string, offset = 0): number {
  if (cursor != null && /^\d+$/.test(cursor)) {
    return Number(cursor);
  }
  return offset;
}

async function requireCatalogReader(
  repo: BotsRepository,
  authorization: string | null,
): Promise<Result<AuthenticatedBot>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return auth;
  }
  if (!canReadAll(auth.data.scopes)) {
    return fail(
      403,
      "forbidden",
      "Esta clave no puede leer el catálogo de todos los bots",
    );
  }
  return auth;
}

export async function listCatalogPosts(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<
  Result<{
    posts: CatalogPost[];
    total: number;
    limit: number;
    offset: number;
  }>
> {
  const auth = await requireCatalogReader(repo, authorization);
  if (!auth.ok) {
    return auth;
  }

  const parsed = catalogPostsQuerySchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los filtros no son válidos",
      formatZodError(parsed.error),
    );
  }

  const filters: PostFilters = {
    kind: parsed.data.kind,
    bot: parsed.data.bot,
    event_from: parsed.data.event_from,
    event_to: parsed.data.event_to,
    from: parsed.data.from,
    to: parsed.data.to,
    upcoming: parsed.data.upcoming,
    q: parsed.data.q,
  };
  const limit = parsed.data.limit;
  const offset = parseOffset(parsed.data.cursor, parsed.data.offset);
  const { posts, total } = await repo.listCatalogPosts(filters, {
    limit,
    offset,
    sortEvents: usesEventSort(filters),
  });

  return {
    ok: true,
    data: {
      posts: posts.map(toCatalogPost),
      total,
      limit,
      offset,
    },
  };
}

export async function listCatalogEvents(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<
  Result<{
    date: string;
    days: number;
    event_from: string;
    event_to: string;
    posts: CatalogPost[];
    total: number;
    limit: number;
    offset: number;
  }>
> {
  const auth = await requireCatalogReader(repo, authorization);
  if (!auth.ok) {
    return auth;
  }

  const parsed = catalogEventsQuerySchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(
      400,
      "invalid_input",
      "Los filtros no son válidos",
      formatZodError(parsed.error),
    );
  }

  const date = parsed.data.date ?? baCalendarDate(new Date());
  const days = parsed.data.days;
  const event_from = date;
  const event_to = addCalendarDays(date, days - 1);
  const limit = parsed.data.limit;
  const offset = parseOffset(parsed.data.cursor, parsed.data.offset);
  const { posts, total } = await repo.listCatalogPosts(
    {
      kind: "evento",
      bot: parsed.data.bot,
      event_from,
      event_to,
      q: parsed.data.q,
    },
    { limit, offset, sortEvents: true },
  );

  return {
    ok: true,
    data: {
      date,
      days,
      event_from,
      event_to,
      posts: posts.map(toCatalogPost),
      total,
      limit,
      offset,
    },
  };
}
