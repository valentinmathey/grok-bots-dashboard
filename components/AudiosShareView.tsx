import { Headphones } from "lucide-react";
import { AudiosList } from "@/components/AudiosList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { listAudioPosts } from "@/lib/audio-posts";
import { getRepository } from "@/lib/data";

/** Vista pública de solo lectura de la sección Audios. */
export async function AudiosShareView({
  token,
  botIds,
  selectedSlug,
}: {
  token: string;
  botIds: string[] | null;
  selectedSlug?: string;
}) {
  const [allBots, allPosts] = await Promise.all([getRepository().listBots(), listAudioPosts()]);
  const allowed = botIds ? new Set(botIds) : null;
  const bots = allowed ? allBots.filter((bot) => allowed.has(bot.id)) : allBots;
  const posts = allowed ? allPosts.filter((post) => allowed.has(post.bot_id)) : allPosts;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 min-w-0 max-w-2xl items-center justify-between gap-3 px-3.5 sm:h-16 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-chip">
              <Headphones size={16} strokeWidth={1.75} />
            </span>
            <p className="truncate text-[15px] font-semibold tracking-tight">Audios</p>
            <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
              Solo lectura
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 space-y-5 px-3.5 pb-[max(4rem,calc(2rem+env(safe-area-inset-bottom)))] pt-5 sm:px-4 sm:pt-6">
        <p className="text-sm text-muted">Versiones habladas de los posts de los bots.</p>
        <AudiosList
          bots={bots}
          posts={posts}
          selectedSlug={selectedSlug}
          basePath={`/compartir/${token}`}
          linkPosts={false}
        />
      </main>
    </div>
  );
}
