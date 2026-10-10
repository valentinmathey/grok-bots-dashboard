import {
  asAlojamiento,
  asResumen,
  hasPriceDrop,
  SUMMARY_BOT_SLUG,
  type ResumenDetails,
  type ResumenHighlight,
} from "@/lib/details";
import { baCalendarDate, baStartOfDay } from "@/lib/event-time";
import { fail } from "@/lib/http";
import { authenticateBot, requireWrite, type BotsRepository } from "@/lib/publishing";
import type { Bot, Post, Result } from "@/lib/types";

const MS_DAY = 86_400_000;

export function baIsoWeekKey(now = new Date()): string {
  const ymd = baCalendarDate(now);
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export function weekPeriod(now = new Date()): { from: string; to: string } {
  const to = baCalendarDate(now);
  const from = baCalendarDate(new Date(now.getTime() - 7 * MS_DAY));
  return { from, to };
}

function highlightFromPost(post: Post): ResumenHighlight {
  const details = asAlojamiento(post.details);
  return {
    title: post.title,
    post_id: post.id,
    score: details?.score,
    price_per_person: details?.price_per_person,
    price_total: details?.price_total,
    currency: details?.currency,
    from: details?.previous_price_per_person ?? details?.previous_price_total,
    to: details?.price_per_person ?? details?.price_total,
  };
}

function upcomingInWindow(posts: Post[], now: Date, days = 14): Post[] {
  const horizon = now.getTime() + days * MS_DAY;
  return posts
    .filter((post) => {
      if (!post.event_at) return false;
      const start = new Date(post.event_at).getTime();
      return start >= baStartOfDay(baCalendarDate(now)).getTime() && start <= horizon;
    })
    .sort(
      (a, b) =>
        new Date(a.event_at ?? 0).getTime() - new Date(b.event_at ?? 0).getTime(),
    )
    .slice(0, 8);
}

function productRank(posts: Post[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    if (!post.product) continue;
    counts.set(post.product, (counts.get(post.product) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, 8)
    .map(([name, count]) => ({ name, posts: count }));
}

export function buildResumenDetails(input: {
  bots: Bot[];
  postsByBot: Record<string, Post[]>;
  now?: Date;
}): ResumenDetails {
  const now = input.now ?? new Date();
  const period = weekPeriod(now);
  return {
    week_key: baIsoWeekKey(now),
    period_from: period.from,
    period_to: period.to,
    generated_at: now.toISOString(),
    bots: input.bots.map((bot) => {
      const posts = input.postsByBot[bot.id] ?? [];
      const recent = posts.filter((post) => {
        if (post.kind === "resumen") return false;
        const created = new Date(post.created_at).getTime();
        return (
          created >= new Date(`${period.from}T00:00:00.000Z`).getTime() &&
          created <= now.getTime()
        );
      });
      const aloj = recent.filter((post) => post.kind === "alojamiento");
      const withScore = aloj
        .map((post) => ({ post, details: asAlojamiento(post.details) }))
        .filter((item) => item.details);
      const best = [...withScore].sort(
        (a, b) => (b.details?.score ?? -1) - (a.details?.score ?? -1),
      )[0];
      const cheapest = [...withScore]
        .filter((item) => item.details?.price_per_person != null)
        .sort(
          (a, b) =>
            (a.details?.price_per_person ?? Infinity) -
            (b.details?.price_per_person ?? Infinity),
        )[0];
      const drops = withScore
        .filter((item) => hasPriceDrop(item.details))
        .map((item) => highlightFromPost(item.post));

      return {
        bot_id: bot.id,
        name: bot.name,
        slug: bot.slug,
        avatar_color: bot.avatar_color ?? null,
        avatar_url: bot.avatar_url ?? null,
        status: bot.status ?? null,
        new_posts: recent.length,
        upcoming_events: upcomingInWindow(posts, now).map((post) => ({
          title: post.title,
          event_at: post.event_at as string,
          event_end_at: post.event_end_at ?? null,
          post_id: post.id,
        })),
        alojamientos:
          aloj.length > 0 || drops.length > 0
            ? {
                new_count: aloj.length,
                best: best ? highlightFromPost(best.post) : undefined,
                cheapest: cheapest ? highlightFromPost(cheapest.post) : undefined,
                price_drops: drops,
              }
            : undefined,
        products: productRank(recent),
      };
    }),
  };
}

export function resumenMarkdown(details: ResumenDetails): string {
  const lines = [
    `## Semana ${details.week_key}`,
    ``,
    `Del **${details.period_from}** al **${details.period_to}**.`,
    ``,
  ];
  for (const bot of details.bots) {
    lines.push(`### ${bot.name}`);
    if (bot.status) lines.push(`- Estado: ${bot.status}`);
    lines.push(`- Publicaciones nuevas: **${bot.new_posts}**`);
    if (bot.upcoming_events?.length) {
      lines.push(`- Próximos eventos:`);
      for (const event of bot.upcoming_events) {
        lines.push(`  - ${event.title} (${event.event_at.slice(0, 10)})`);
      }
    }
    if (bot.alojamientos) {
      lines.push(`- Alojamientos nuevos: **${bot.alojamientos.new_count}**`);
      if (bot.alojamientos.best) {
        lines.push(
          `  - Mejor precio-calidad: ${bot.alojamientos.best.title} (${bot.alojamientos.best.score ?? "—"})`,
        );
      }
      if (bot.alojamientos.cheapest) {
        lines.push(
          `  - Más barato por persona: ${bot.alojamientos.cheapest.title}`,
        );
      }
      if (bot.alojamientos.price_drops?.length) {
        lines.push(`  - Bajaron de precio: ${bot.alojamientos.price_drops.length}`);
      }
    }
    if (bot.products?.length) {
      lines.push(
        `- Productos: ${bot.products.map((item) => `${item.name} (${item.posts})`).join(", ")}`,
      );
    }
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

export function resumenTitle(details: ResumenDetails): string {
  return `Resumen semanal · ${details.week_key}`;
}

export async function upsertWeeklySummary(
  repo: BotsRepository,
  now = new Date(),
): Promise<
  Result<{
    post: Post;
    created: boolean;
    week_key: string;
    bot: { id: string; name: string; slug: string };
  }>
> {
  const publisher = await repo.getBotBySlug(SUMMARY_BOT_SLUG);
  if (!publisher) {
    return fail(
      404,
      "not_found",
      `No está el bot ${SUMMARY_BOT_SLUG} para publicar el resumen`,
    );
  }

  const bots = await repo.listBots();
  const postsByBot: Record<string, Post[]> = {};
  for (const bot of bots) {
    postsByBot[bot.id] = await repo.listPostsByBot(bot.id);
  }

  const details = buildResumenDetails({ bots, postsByBot, now });
  const title = resumenTitle(details);
  const body = resumenMarkdown(details);

  const existing = (postsByBot[publisher.id] ?? []).find(
    (post) => post.kind === "resumen" && asResumen(post.details)?.week_key === details.week_key,
  );

  if (existing) {
    const updated = await repo.updatePost(existing.id, {
      title,
      body,
      kind: "resumen",
      details: details as unknown as Record<string, unknown>,
    });
    return {
      ok: true,
      data: {
        post: updated,
        created: false,
        week_key: details.week_key,
        bot: { id: publisher.id, name: publisher.name, slug: publisher.slug },
      },
    };
  }

  const created = await repo.insertPost({
    botId: publisher.id,
    title,
    body,
    kind: "resumen",
    product: null,
    tags: ["resumen", "semana"],
    cover_image_url: null,
    images: [],
    event_at: null,
    event_end_at: null,
    details: details as unknown as Record<string, unknown>,
  });
  const post = (await repo.getPostById(created.id)) ?? {
    ...created,
    bot_id: publisher.id,
    body_markdown: body,
    details: details as unknown as Record<string, unknown>,
  };

  return {
    ok: true,
    status: 201,
    data: {
      post,
      created: true,
      week_key: details.week_key,
      bot: { id: publisher.id, name: publisher.name, slug: publisher.slug },
    },
  };
}

export async function publishWeeklySummaryForBot(
  repo: BotsRepository,
  authorization: string | null,
  now = new Date(),
): Promise<
  Result<{
    post: Post;
    created: boolean;
    week_key: string;
    bot: { id: string; name: string; slug: string };
  }>
> {
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
      `Solo ${SUMMARY_BOT_SLUG} puede generar el resumen semanal`,
    );
  }
  return upsertWeeklySummary(repo, now);
}
