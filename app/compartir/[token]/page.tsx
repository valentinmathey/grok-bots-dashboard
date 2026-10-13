import { notFound } from "next/navigation";
import { ShareChrome } from "@/components/ShareChrome";
import { PostFeed } from "@/components/PostFeed";
import { TimeStamp } from "@/components/TimeStamp";
import { PAGE_SIZE, parseFeedQuery } from "@/lib/filters";
import { getRepository } from "@/lib/data";
import { loadAudiosShare, loadShare } from "@/lib/share-page";
import { AudiosShareView } from "@/components/AudiosShareView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const share = await loadShare(token);
  const audios = share ? null : await loadAudiosShare(token);
  return {
    title: share
      ? `${share.bot.name} · Solo lectura`
      : audios
        ? "Audios · Solo lectura"
        : "No encontrado",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function ShareBotPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const search = await searchParams;
  const share = await loadShare(token);
  if (!share) {
    const audios = await loadAudiosShare(token);
    if (!audios) notFound();
    const bot = typeof search.bot === "string" ? search.bot : undefined;
    return <AudiosShareView token={token} botIds={audios.botIds} selectedSlug={bot} />;
  }

  const repo = getRepository();
  const { bot } = share;
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
  const basePath = `/compartir/${token}`;
  const busy = Boolean(bot.status?.trim());

  return (
    <ShareChrome bot={bot}>
      {bot.description ? (
        <p className="mb-5 text-sm leading-6 text-muted">{bot.description}</p>
      ) : null}

      {busy ? (
        <section className="surface mb-5 min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
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
        basePath={basePath}
        postsApi={`/api/compartir/${token}/posts`}
        postHrefBase={basePath}
        bot={bot}
      />
    </ShareChrome>
  );
}
