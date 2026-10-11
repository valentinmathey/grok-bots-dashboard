import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { KindBadge } from "@/components/KindBadge";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bot?: string; kind?: string; sort?: string; favorites?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const repo = getRepository();
  const [bots, result] = await Promise.all([
    repo.listBots(),
    q.length >= 2 || params.kind
      ? repo.searchPosts({
          q,
          bots: params.bot ? [params.bot] : undefined,
          kinds: params.kind ? [params.kind] : undefined,
          favoritesOnly: params.favorites === "1",
          sort: params.sort === "newest" ? "newest" : "relevance",
          limit: 40,
        })
      : Promise.resolve({ hits: [], total: 0 }),
  ]);
  if (params.favorites === "1" && result.hits.length) {
    const { listFavorites } = await import("@/lib/favorites-store");
    const ids = new Set((await listFavorites()).map((row) => row.post_id));
    result.hits = result.hits.filter((hit) => ids.has(hit.id));
  }

  function href(next: Record<string, string | undefined>) {
    const query = new URLSearchParams();
    const merged = {
      q,
      bot: params.bot,
      kind: params.kind,
      sort: params.sort,
      favorites: params.favorites,
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    return `/buscar?${query.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Buscar</h1>
        <form className="mt-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="n8n, Camboriu, logitech…"
            className="min-h-11 w-full rounded-full border border-line bg-card px-4 text-sm"
          />
        </form>
      </div>
      {bots.length ? (
        <div className="chip-row">
          <Link
            href={href({ bot: undefined })}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-medium ${!params.bot ? "bg-accent text-accent-ink" : "bg-chip"}`}
          >
            Todos
          </Link>
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={href({ bot: bot.slug })}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-medium ${params.bot === bot.slug ? "bg-accent text-accent-ink" : "bg-chip"}`}
            >
              {bot.name}
            </Link>
          ))}
          <Link
            href={href({ favorites: params.favorites === "1" ? undefined : "1" })}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs font-medium ${params.favorites === "1" ? "bg-accent text-accent-ink" : "bg-chip"}`}
          >
            Solo favoritos
          </Link>
        </div>
      ) : null}
      {q.length < 2 && !params.kind ? (
        <p className="text-sm text-muted">Escribí al menos dos letras.</p>
      ) : result.hits.length === 0 ? (
        <p className="text-sm text-muted">
          {q.length >= 2 ? `Nada con “${q}”.` : "Nada con ese filtro."}
        </p>
      ) : (
        <ul className="space-y-2">
          {result.hits.map((hit) => (
            <li key={hit.id}>
              <Link href={hit.url} className="surface flex gap-3 rounded-3xl p-3">
                <BotAvatar bot={hit.bot} size="sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{hit.title}</p>
                    <KindBadge kind={hit.kind} />
                  </div>
                  <p
                    className="mt-1 text-sm leading-6 text-muted [&_mark]:rounded [&_mark]:bg-accent/20 [&_mark]:px-0.5 [&_mark]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: hit.snippet }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
