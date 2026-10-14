import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip, SegmentedControl } from "@/components/FilterChip";
import { KindBadge } from "@/components/KindBadge";
import { TimeStamp } from "@/components/TimeStamp";
import { PUBLICACIONES_PAGE, listAllPosts } from "@/lib/all-posts";
import { getRepository } from "@/lib/data";
import { markdownExcerpt } from "@/lib/excerpt";
import { formatDateTime, kindLabel } from "@/lib/format";
import type { PostKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { bot?: string; kind?: string; orden?: string; n?: string };

function href(p: { bots: string[]; kind?: string; oldest: boolean; n?: number }) {
  const q = new URLSearchParams();
  if (p.bots.length) q.set("bot", p.bots.join(","));
  if (p.kind) q.set("kind", p.kind);
  if (p.oldest) q.set("orden", "antiguas");
  if (p.n && p.n > PUBLICACIONES_PAGE) q.set("n", String(p.n));
  const s = q.toString();
  return s ? `/publicaciones?${s}` : "/publicaciones";
}

export default async function PublicacionesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const bots = await getRepository().listBots();
  const selectedSlugs = (params.bot ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => bots.some((b) => b.slug === s));
  const selectedIds = bots.filter((b) => selectedSlugs.includes(b.slug)).map((b) => b.id);
  const oldest = params.orden === "antiguas";
  const kind = params.kind && /^[a-z0-9_-]{1,40}$/.test(params.kind) ? params.kind : undefined;
  const limit = Math.min(Math.max(Number(params.n) || PUBLICACIONES_PAGE, PUBLICACIONES_PAGE), 600);
  const { posts, total } = await listAllPosts({ botIds: selectedIds, kind, oldest, limit });
  const kinds = [...new Set((await listAllPosts({ botIds: selectedIds, limit: 600 })).posts.map((p) => p.kind))]
    .filter(Boolean)
    .sort();
  const base = { bots: selectedSlugs, kind, oldest };
  const toggleBot = (slug: string) =>
    selectedSlugs.includes(slug) ? selectedSlugs.filter((s) => s !== slug) : [...selectedSlugs, slug];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Publicaciones</h1>
        <p className="mt-1.5 text-sm text-muted">Todo lo que publicaron tus bots, en un solo lugar.</p>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <ArrowUpDown size={13} strokeWidth={1.75} />
          Ordenar por
        </p>
        <SegmentedControl
          ariaLabel="Ordenar por"
          className="w-full sm:w-auto sm:min-w-[18rem]"
          value={oldest ? "antiguas" : "nuevas"}
          options={[
            { id: "nuevas", label: "Más nuevas", href: href({ ...base, oldest: false }) },
            { id: "antiguas", label: "Más antiguas", href: href({ ...base, oldest: true }) },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bots</p>
        <ChipRow>
          <FilterChip href={href({ ...base, bots: [] })} selected={!selectedSlugs.length}>
            Todos
          </FilterChip>
          {bots.map((bot) => (
            <FilterChip
              key={bot.id}
              href={href({ ...base, bots: toggleBot(bot.slug) })}
              selected={selectedSlugs.includes(bot.slug)}
              check={selectedSlugs.includes(bot.slug)}
            >
              {bot.name}
            </FilterChip>
          ))}
        </ChipRow>
        {kinds.length > 1 ? (
          <>
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted">Tipo</p>
            <ChipRow>
              <FilterChip href={href({ ...base, kind: undefined })} selected={!kind}>
                Todos
              </FilterChip>
              {kinds.map((k) => (
                <FilterChip key={k} href={href({ ...base, kind: kind === k ? undefined : k })} selected={kind === k}>
                  {kindLabel(k as PostKind)}
                </FilterChip>
              ))}
            </ChipRow>
          </>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-center">
          <p className="font-medium">No hay publicaciones</p>
          <p className="mt-1 text-sm text-muted">Probá con otros filtros o esperá a que los bots publiquen.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted">
            {posts.length} de {total}
          </p>
          <ul className="space-y-2">
            {posts.map((post) => {
              const bot = bots.find((b) => b.id === post.bot_id);
              const summary = markdownExcerpt(post.body_markdown, 200);
              return (
                <li key={post.id}>
                  <Link
                    href={bot ? `/bots/${bot.slug}#post-${post.id}` : "#"}
                    className="surface block min-w-0 rounded-3xl p-3.5 transition-colors hover:bg-chip/40 sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {bot ? <BotAvatar bot={bot} size="sm" className="shrink-0" /> : null}
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted">{bot?.name ?? "Bot"}</p>
                      {post.kind ? (
                        <span className="shrink-0">
                          <KindBadge kind={post.kind as PostKind} />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 break-words font-semibold leading-snug">{post.title}</p>
                    {summary ? (
                      <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-muted">{summary}</p>
                    ) : null}
                    <p className="mt-1.5 text-xs text-muted">
                      <TimeStamp iso={post.created_at} /> · {formatDateTime(post.created_at)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
          {posts.length < total ? (
            <div className="flex justify-center">
              <Link
                href={href({ ...base, n: limit + PUBLICACIONES_PAGE })}
                scroll={false}
                className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-medium"
              >
                Cargar más
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
