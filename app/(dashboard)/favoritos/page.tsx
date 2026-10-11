import { Star } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { FilterToolbar } from "@/components/FilterToolbar";
import { KindBadge } from "@/components/KindBadge";
import { PostCard } from "@/components/PostCard";
import { getRepository } from "@/lib/data";
import { listFavorites, listItemFavorites } from "@/lib/favorites-store";
import { deadlineChipLabel } from "@/lib/details";
import { asOportunidades } from "@/lib/details";
import { formatEventWhen } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FavoritosPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const repo = getRepository();
  const [favs, items, bots] = await Promise.all([
    listFavorites(),
    listItemFavorites(),
    repo.listBots(),
  ]);
  const posts = (
    await Promise.all(favs.map((fav) => repo.getPostById(fav.post_id)))
  ).filter((post): post is NonNullable<typeof post> => Boolean(post));
  const botById = new Map(bots.map((bot) => [bot.id, bot]));
  const filtered = posts.filter((post) => {
    const bot = botById.get(post.bot_id);
    if (params.bot && bot?.slug !== params.bot) return false;
    if (params.kind && post.kind !== params.kind) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Guardados</h1>
        <p className="mt-1.5 text-sm text-muted">
          Estrellas en las cards. Si borrás el post, desaparece de acá.
        </p>
      </div>
      <FilterToolbar applied={params.bot ? 1 : 0}>
        <ChipRow>
          <FilterChip href="/favoritos" selected={!params.bot}>
            Todos
          </FilterChip>
          {bots.map((bot) => (
            <FilterChip
              key={bot.id}
              href={`/favoritos?bot=${bot.slug}`}
              selected={params.bot === bot.slug}
            >
              <span className="min-w-0 truncate">{bot.name}</span>
            </FilterChip>
          ))}
        </ChipRow>
      </FilterToolbar>
      {items.length ? (
        <section className="surface rounded-3xl p-4">
          <h2 className="text-sm font-semibold">Ítems guardados</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>{item.label || item.item_key}</span>
                {item.price_at_save != null ? (
                  <span className="text-xs text-muted">al guardar: {item.price_at_save}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {filtered.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Star size={14} strokeWidth={1.75} />
          Todavía no guardaste nada.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const bot = botById.get(post.bot_id);
            const fav = favs.find((row) => row.post_id === post.id);
            const details = asOportunidades(post.details);
            return (
              <div key={post.id} className="space-y-1">
                {bot ? (
                  <div className="flex items-center gap-2 px-1 text-xs text-muted">
                    <BotAvatar bot={bot} size="sm" />
                    {bot.name}
                    <KindBadge kind={post.kind} />
                    {post.event_at ? <span>{formatEventWhen(post.event_at)}</span> : null}
                    {details?.items[0]?.deadline ? (
                      <span>{deadlineChipLabel(details.items[0].deadline)}</span>
                    ) : null}
                  </div>
                ) : null}
                {fav?.note ? <p className="px-1 text-xs text-muted">Nota: {fav.note}</p> : null}
                <PostCard post={post} filterBasePath={bot ? `/bots/${bot.slug}` : "/favoritos"} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
