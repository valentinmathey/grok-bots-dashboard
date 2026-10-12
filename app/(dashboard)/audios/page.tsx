import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { PostAudio } from "@/components/PostAudio";
import { postAudio } from "@/lib/post-audio";
import { SingleAudioPlayback } from "@/components/SingleAudioPlayback";
import { getRepository } from "@/lib/data";
import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Mendoza",
});

async function listAudioPosts(): Promise<Post[]> {
  if (isPreviewMode()) return [];
  const { data, error } = await createAdminClient()
    .from("posts")
    .select("*")
    .not("details->>audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return ((data ?? []) as Post[]).filter((post) => postAudio(post));
}

export default async function AudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string }>;
}) {
  const params = await searchParams;
  const [bots, posts] = await Promise.all([getRepository().listBots(), listAudioPosts()]);
  const botIds = new Set(posts.map((post) => post.bot_id));
  const botsWithAudio = bots.filter((bot) => botIds.has(bot.id));
  const selected = params.bot ? bots.find((bot) => bot.slug === params.bot) : undefined;
  const rows = posts
    .filter((post) => !selected || post.bot_id === selected.id)
    .map((post) => ({ post, bot: bots.find((bot) => bot.id === post.bot_id) }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Audios</h1>
        <p className="mt-1.5 text-sm text-muted">
          Las versiones habladas que publicaron tus bots.
        </p>
      </div>
      {botsWithAudio.length > 1 ? (
        <ChipRow>
          <FilterChip href="/audios" selected={!selected}>
            Todos
          </FilterChip>
          {botsWithAudio.map((bot) => (
            <FilterChip
              key={bot.id}
              href={`/audios?bot=${bot.slug}`}
              selected={selected?.id === bot.id}
            >
              {bot.name}
            </FilterChip>
          ))}
        </ChipRow>
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
                        {bot?.name ?? "Bot"} · {dateFormat.format(new Date(post.created_at))}
                        {audio?.duration ? ` · ${formatDuration(audio.duration)}` : ""}
                      </p>
                      <Link
                        href={bot ? `/bots/${bot.slug}#post-${post.id}` : "#"}
                        className="line-clamp-2 break-words font-semibold leading-snug hover:underline"
                      >
                        {post.title}
                      </Link>
                    </div>
                  </div>
                  <PostAudio post={post} />
                </li>
              );
            })}
          </ul>
        </SingleAudioPlayback>
      )}
    </div>
  );
}
