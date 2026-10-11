import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { NavTitle } from "@/components/nav-context";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PostFeed } from "@/components/PostFeed";
import { TimeStamp } from "@/components/TimeStamp";
import { resolveAvatar } from "@/lib/avatar";
import { getRepository } from "@/lib/data";
import { PAGE_SIZE, parseFeedQuery } from "@/lib/filters";

export default async function BotPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const repo = getRepository();
  const bot = await repo.getBotBySlug(slug);
  if (!bot) {
    notFound();
  }

  const facets = await repo.listFacets(bot.id);
  const query = parseFeedQuery(search, {
    hasEvents: facets.has_events,
    hasAlojamientos: facets.has_alojamientos,
    hasOportunidades: facets.has_oportunidades,
  });
  const page = await repo.listPostsPage(bot.id, query, {
    sort: query.sort,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const busy = Boolean(bot.status?.trim());
  const avatar = resolveAvatar(bot);

  return (
    <div
      className="bot-skin mx-auto min-w-0 max-w-2xl space-y-5 sm:space-y-6"
      style={{ "--bot-fill": avatar.fill } as React.CSSProperties}
    >
      <NavTitle title={bot.name} />
      <div className="min-w-0">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Bots
        </Link>
        <div className="mt-3 flex items-start gap-3">
          <BotAvatar bot={bot} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="page-heading break-words text-[1.65rem] font-semibold tracking-tight sm:text-[1.75rem]">
                {bot.name}
              </h1>
              <LiveRefresh />
            </div>
            {bot.description ? (
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {bot.description}
              </p>
            ) : null}
            <p className="mt-2">
              <Link href={`/estadisticas?bot=${bot.slug}`} className="text-xs font-medium text-accent">
                Estadísticas
              </Link>
            </p>
          </div>
        </div>
      </div>

      {busy ? (
        <section className="surface min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
            En qué está
          </p>
          <p className="mt-2 flex items-start gap-2 text-[1.05rem] leading-7">
            <span className="mt-2 h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
            <span className="min-w-0 break-words">{bot.status}</span>
          </p>
          {bot.status_updated_at ? (
            <p className="mt-2 pl-4 text-xs text-muted">
              Actualizado <TimeStamp iso={bot.status_updated_at} />
            </p>
          ) : null}
        </section>
      ) : null}

      <PostFeed
        key={JSON.stringify(query)}
        slug={bot.slug}
        query={query}
        initialPosts={page.posts}
        total={page.total}
        facets={facets}
        bot={bot}
      />
    </div>
  );
}
