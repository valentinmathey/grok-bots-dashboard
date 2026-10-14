import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { FilterGroup, FilterToolbar } from "@/components/FilterToolbar";
import { PostAudio } from "@/components/PostAudio";
import { SingleAudioPlayback } from "@/components/SingleAudioPlayback";
import { postAudio } from "@/lib/post-audio";
import type { Bot, Post } from "@/lib/types";

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Mendoza",
});

const timeFormat = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Mendoza",
});

/** "14 de oct de 2026 · 07:12" en hora de Mendoza. */
export function formatAudioPublished(iso: string) {
  const date = new Date(iso);
  return `${dateFormat.format(date)} · ${timeFormat.format(date)}`;
}

/** Lista de audios compartida entre /audios y el link público. */
export function AudiosList({
  bots,
  posts,
  selectedSlug,
  basePath,
  linkPosts,
}: {
  bots: Bot[];
  posts: Post[];
  selectedSlug?: string;
  basePath: string;
  /** false en la vista pública: solo título, sin links a posts privados. */
  linkPosts: boolean;
}) {
  const botIds = new Set(posts.map((post) => post.bot_id));
  const botsWithAudio = bots.filter((bot) => botIds.has(bot.id));
  const selected = selectedSlug ? botsWithAudio.find((bot) => bot.slug === selectedSlug) : undefined;
  const rows = posts
    .filter((post) => !selected || post.bot_id === selected.id)
    .map((post) => ({ post, bot: bots.find((bot) => bot.id === post.bot_id) }));

  return (
    <>
      {botsWithAudio.length > 1 ? (
        <FilterToolbar
          applied={selected ? 1 : 0}
          clearHref={basePath}
          activeChips={selected ? [{ label: selected.name, removeHref: basePath }] : []}
        >
          <FilterGroup label="Bots">
            <ChipRow>
              <FilterChip href={basePath} selected={!selected}>
                Todos
              </FilterChip>
              {botsWithAudio.map((bot) => (
                <FilterChip key={bot.id} href={`${basePath}?bot=${bot.slug}`} selected={selected?.id === bot.id}>
                  {bot.name}
                </FilterChip>
              ))}
            </ChipRow>
          </FilterGroup>
        </FilterToolbar>
      ) : null}
      {rows.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-center">
          <p className="font-medium">Todavía no hay audios</p>
          <p className="mt-1 text-sm text-muted">
            Cuando un bot suba la versión hablada de un post, aparece acá.
          </p>
        </div>
      ) : (
        <SingleAudioPlayback>
          <ul className="space-y-3">
            {rows.map(({ post, bot }) => {
              const audio = postAudio(post);
              return (
                <li key={post.id} className="surface min-w-0 rounded-3xl p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {bot ? <BotAvatar bot={bot} size="sm" className="shrink-0" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted">
                        {bot?.name ?? "Bot"} · {formatAudioPublished(post.created_at)}
                      </p>
                      {linkPosts && bot ? (
                        <Link
                          href={`/bots/${bot.slug}#post-${post.id}`}
                          className="line-clamp-2 break-words font-semibold leading-snug hover:underline"
                        >
                          {post.title}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 break-words font-semibold leading-snug">{post.title}</p>
                      )}
                    </div>
                  </div>
                  <PostAudio post={post} />
                </li>
              );
            })}
          </ul>
        </SingleAudioPlayback>
      )}
    </>
  );
}
