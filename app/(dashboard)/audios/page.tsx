import { AudiosList } from "@/components/AudiosList";
import { listAudioPosts } from "@/lib/audio-posts";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string }>;
}) {
  const params = await searchParams;
  const [bots, posts] = await Promise.all([getRepository().listBots(), listAudioPosts()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Audios</h1>
        <p className="mt-1.5 text-sm text-muted">Las versiones habladas que publicaron tus bots.</p>
      </div>
      <AudiosList bots={bots} posts={posts} selectedSlug={params.bot} basePath="/audios" linkPosts />
    </div>
  );
}
