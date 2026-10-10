import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { ShareChrome } from "@/components/ShareChrome";
import { loadSharedPost } from "@/lib/share-page";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string; postId: string }>;
}): Promise<Metadata> {
  const { token, postId } = await params;
  const share = await loadSharedPost(token, postId);
  return {
    title: share ? `${share.post.title} · ${share.bot.name}` : "No encontrado",
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function SharePostPage({
  params,
}: {
  params: Promise<{ token: string; postId: string }>;
}) {
  const { token, postId } = await params;
  const share = await loadSharedPost(token, postId);
  if (!share) {
    notFound();
  }

  const basePath = `/compartir/${token}`;

  return (
    <ShareChrome bot={share.bot}>
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Volver
      </Link>
      <PostCard
        post={share.post}
        filterBasePath={basePath}
        href={`${basePath}/${share.post.id}`}
        defaultOpen
      />
    </ShareChrome>
  );
}
