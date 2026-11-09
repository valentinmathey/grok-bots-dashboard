import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { BuscarFilters } from "@/components/BuscarFilters";
import { BuscarLive } from "@/components/BuscarLive";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { KindBadge } from "@/components/KindBadge";
import { getRepository } from "@/lib/data";
import {
  countSearchUiFilters,
  kindsForGroups,
  parseSearchUiFilters,
  searchUiHasAdvanced,
} from "@/lib/search-filters";
import { emptyResultLabel, resultCountLabel } from "@/lib/search-copy";

export const dynamic = "force-dynamic";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : Array.isArray(params.q) ? params.q[0] : "")?.trim() ?? "";
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const filters = parseSearchUiFilters(params);
  const advanced = searchUiHasAdvanced(filters);
  const repo = getRepository();

  const [bots, favoriteIds, registeredIds] = await Promise.all([
    repo.listBots(),
    filters.favoritesOnly
      ? import("@/lib/favorites-store").then((m) => m.listFavorites().then((rows) => rows.map((r) => r.post_id)))
      : Promise.resolve(undefined as string[] | undefined),
    filters.registered
      ? import("@/lib/registrations-store").then((m) => m.listRegisteredIds())
      : Promise.resolve(undefined as string[] | undefined),
  ]);

  const kinds = filters.kindGroups.length ? kindsForGroups(filters.kindGroups) : undefined;
  const shouldSearch = q.length >= 2 || advanced;

  const result = shouldSearch
    ? await repo.searchPosts({
        q,
        bots: filters.bots.length ? filters.bots : undefined,
        kinds,
        sort: sort === "newest" ? "newest" : "relevance",
        limit: 40,
        importance: filters.importance.length ? filters.importance : undefined,
        ui: filters,
        favoriteIds,
        registeredIds,
      })
    : { hits: [], total: 0 };

  const count = Math.max(result.total, result.hits.length);
  const applied = countSearchUiFilters(filters);

  return (
    <div>
      <h1 className="page-heading text-2xl font-semibold tracking-tight">Buscar</h1>
      <BuscarLive
        initialQ={q}
        toolbar={
          bots.length ? (
            <BuscarFilters
              q={q}
              sort={sort}
              filters={filters}
              bots={bots.map((b) => ({ id: b.id, slug: b.slug, name: b.name }))}
              resultsCount={count}
            />
          ) : null
        }
      >
        {q.length < 2 && !advanced ? (
          <p className="text-sm text-muted">
            Escribí al menos dos letras para buscar, o abrí Filtros
            {applied ? ` (${applied})` : ""}.
          </p>
        ) : result.hits.length === 0 ? (
          <p className="surface rounded-3xl px-4 py-8 text-center text-sm text-muted">
            {emptyResultLabel(q.length >= 2 ? q : "")}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              {resultCountLabel(count, q.length >= 2 ? q : "")}
            </p>
            <ul className="space-y-2">
              {result.hits.map((hit) => (
                <li key={hit.id}>
                  <Link href={hit.url} className="surface flex gap-3 rounded-3xl p-3" prefetch>
                    <BotAvatar bot={hit.bot} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {hit.importance ? (
                          <ImportanceBadge details={{ importance: hit.importance }} compact />
                        ) : null}
                        <KindBadge kind={hit.kind} />
                      </div>
                      <p className="mt-1 font-semibold [overflow-wrap:anywhere]">{hit.title}</p>
                      <p
                        className="mt-1 text-sm leading-6 text-muted [&_mark]:rounded [&_mark]:bg-accent/20 [&_mark]:px-0.5 [&_mark]:text-foreground"
                        dangerouslySetInnerHTML={{ __html: hit.snippet }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </BuscarLive>
    </div>
  );
}
