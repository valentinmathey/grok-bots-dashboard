import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { NavTitle } from "@/components/nav-context";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PostFeed } from "@/components/PostFeed";
import { EventoChanges } from "@/components/EventoChanges";
import { pickEventoChanges } from "@/lib/evento-changes";
import { AgendaViva } from "@/components/mza/AgendaViva";
import { VuelosView } from "@/components/VuelosView";
import { cookies } from "next/headers";
import { VISIT_COOKIE } from "@/lib/last-seen";
import { MZA_BOT_SLUGS, MZA_KINDS, type MzaKind } from "@/lib/mendoza";
import { GeneralRequestButton } from "@/components/RequestModal";
import { TimeStamp } from "@/components/TimeStamp";
import { resolveAvatar } from "@/lib/avatar";
import { getRepository } from "@/lib/data";
import { PAGE_SIZE, parseFeedQuery } from "@/lib/filters";
import { getOwnerFromRequest } from "@/lib/auth";
import { WatchlistPanel, type WatchRankingSummary } from "@/components/WatchlistPanel";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { listWatchlist } from "@/lib/watchlist";
import { matchesWatchItem } from "@/lib/watchlist-shared";
import {
  rankingBestOffer,
  rankingDetailsSchema,
  rankingDropPct,
  rankingLowest,
} from "@/lib/rich-details";

const WATCHLIST_BOT_SLUGS = new Set(["productos-compra"]);

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
  // Bots de Mendoza: vista "agenda viva" (con ?vista=feed se ve el feed clásico).
  const mzaKind: MzaKind | undefined =
    MZA_BOT_SLUGS[bot.slug] ??
    MZA_KINDS.find((kind) => facets.kinds.includes(kind));
  const showAgendaViva = Boolean(mzaKind) && search.vista !== "feed";
  const mzaPosts =
    showAgendaViva && mzaKind
      ? await repo.listPostsByBot(bot.id, { kind: mzaKind })
      : [];
  const showVuelos = bot.slug === "vuelos" && search.vista !== "feed";
  const vueloPosts = showVuelos
    ? await repo.listPostsByBot(bot.id, { kind: "vuelo" })
    : [];
  const visitRaw = showAgendaViva
    ? (await cookies()).get(VISIT_COOKIE)?.value
    : undefined;
  const query = parseFeedQuery(search, {
    hasEvents: facets.has_events,
    hasAlojamientos: facets.has_alojamientos,
    hasOportunidades: facets.has_oportunidades,
  });
  const eventoChanges =
    !showAgendaViva && facets.kinds.includes("evento") && query.when !== "past"
      ? pickEventoChanges(await repo.listPostsByBot(bot.id, { kind: "evento" }))
      : [];
  const page = await repo.listPostsPage(bot.id, query, {
    sort: query.sort,
    limit: PAGE_SIZE,
    offset: 0,
  });

  const watchlist =
    WATCHLIST_BOT_SLUGS.has(bot.slug) && (await getOwnerFromRequest())
      ? await loadWatchlist(repo, bot.id)
      : null;

  const busy = Boolean(bot.status?.trim());
  const avatar = resolveAvatar(bot);
  const requestBot = {
    id: bot.id,
    name: bot.name,
    slug: bot.slug,
    avatar_color: bot.avatar_color,
    avatar_url: bot.avatar_url,
  };

  const content = (
    <div
      className="bot-skin mx-auto min-w-0 max-w-2xl space-y-5 sm:space-y-6"
      style={{ "--bot-fill": avatar.fill } as React.CSSProperties}
    >
      <NavTitle title={bot.name} />
      <div className="min-w-0">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent"
        >
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
              <div className="flex shrink-0 items-center gap-2">
                <GeneralRequestButton
                  bot={requestBot}
                  className="hidden sm:inline-flex"
                />
                <LiveRefresh />
              </div>
            </div>
            {bot.description ? (
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {bot.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <GeneralRequestButton
                bot={requestBot}
                className="inline-flex sm:hidden"
              />
              <Link
                href={`/estadisticas?bot=${bot.slug}`}
                className="text-xs font-medium text-accent"
              >
                Estadísticas
              </Link>
            </div>
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

      {watchlist ? (
        <WatchlistPanel rankings={watchlist.rankings} />
      ) : null}

      {showAgendaViva && mzaKind ? (
        <>
          <AgendaViva
            kind={mzaKind}
            posts={mzaPosts}
            nowIso={new Date().toISOString()}
            baselineIso={visitRaw ? decodeURIComponent(visitRaw) : null}
          />
          <p className="text-center">
            <Link
              href={`/bots/${bot.slug}?vista=feed`}
              className="text-xs font-medium text-accent"
            >
              Ver todas las publicaciones
            </Link>
          </p>
        </>
      ) : showVuelos ? (
        <>
          <VuelosView posts={vueloPosts} bot={requestBot} />
          <p className="text-center">
            <Link
              href={`/bots/${bot.slug}?vista=feed`}
              className="text-xs font-medium text-accent"
            >
              Ver todas las publicaciones
            </Link>
          </p>
        </>
      ) : (
        <>
        <EventoChanges posts={eventoChanges} basePath={`/bots/${bot.slug}`} bot={bot} />
        <PostFeed
          key={JSON.stringify(query)}
          slug={bot.slug}
          query={query}
          initialPosts={page.posts}
          total={page.total}
          facets={facets}
          bot={bot}
        />
        </>
      )}
    </div>
  );
  return watchlist ? (
    <WatchlistProvider botId={bot.id} initialItems={watchlist.items}>
      {content}
    </WatchlistProvider>
  ) : (
    content
  );
}

async function loadWatchlist(repo: ReturnType<typeof getRepository>, botId: string) {
  const items = await listWatchlist(botId).catch(() => []);
  const posts = items.length ? await repo.listPostsByBot(botId, { kind: "ranking" }) : [];
  const parsed = posts
    .map((post) => ({ post, d: rankingDetailsSchema.safeParse(post.details ?? {}) }))
    .filter((x) => x.d.success)
    .map((x) => ({ post: x.post, d: x.d.data! }));
  const rankings: Record<string, WatchRankingSummary> = {};
  for (const item of items) {
    const exact = parsed.find((x) => x.d.source_id === `watch:${item.id}`);
    const hit = exact ?? parsed.find((x) => matchesWatchItem(item, null, x.d.product_name));
    if (!hit) continue;
    const best = rankingBestOffer(hit.d);
    const lowest = rankingLowest(hit.d);
    rankings[item.id] = {
      post_id: hit.post.id,
      best_price: best?.price ?? null,
      best_store: best?.store ?? null,
      currency: /^[A-Z]{3}$/.test(hit.d.currency ?? "") ? hit.d.currency! : "ARS",
      lowest_price: lowest?.price ?? null,
      drop_pct: rankingDropPct(hit.d),
      back_in_stock: hit.d.back_in_stock === true,
      checked_at: hit.d.checked_at ?? null,
    };
  }
  return { items, rankings };
}
