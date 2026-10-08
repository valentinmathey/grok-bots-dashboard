import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PostFeed } from "@/components/PostFeed";
import { TimeStamp } from "@/components/TimeStamp";
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
  const query = parseFeedQuery(await searchParams);
  const repo = getRepository();
  const bot = await repo.getBotBySlug(slug);
  if (!bot) {
    notFound();
  }

  const [page, facets] = await Promise.all([
    repo.listPostsPage(bot.id, query, {
      sort: query.sort,
      limit: PAGE_SIZE,
      offset: 0,
    }),
    repo.listFacets(bot.id),
  ]);

  const busy = Boolean(bot.status?.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/" className="text-sm font-medium text-accent">
          ← Bots
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.75rem] font-semibold tracking-tight">
              {bot.name}
            </h1>
            {bot.description ? (
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {bot.description}
              </p>
            ) : null}
          </div>
          <LiveRefresh />
        </div>
      </div>

      <section className="surface rounded-3xl p-4 sm:p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          En qué está
        </p>
        <p className="mt-2 flex items-start gap-2 text-[17px] leading-7">
          <span
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${busy ? "animate-pulse bg-accent" : "bg-muted/40"}`}
          />
          {busy ? bot.status : "Todavía no actualizó su estado."}
        </p>
        {bot.status_updated_at ? (
          <p className="mt-2 pl-4 text-xs text-muted">
            Actualizado <TimeStamp iso={bot.status_updated_at} />
          </p>
        ) : null}
      </section>

      <PostFeed
        key={JSON.stringify(query)}
        slug={bot.slug}
        query={query}
        initialPosts={page.posts}
        total={page.total}
        facets={facets}
      />
    </div>
  );
}
