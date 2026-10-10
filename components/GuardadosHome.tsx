import Link from "next/link";
import { Star } from "lucide-react";
import { getRepository } from "@/lib/data";
import { listFavorites } from "@/lib/favorites-store";
import { formatEventWhen } from "@/lib/format";

export async function GuardadosHome() {
  const favs = await listFavorites();
  if (!favs.length) return null;
  const repo = getRepository();
  const posts = (
    await Promise.all(favs.slice(0, 8).map((fav) => repo.getPostById(fav.post_id)))
  ).filter((post): post is NonNullable<typeof post> => Boolean(post));
  const next = posts
    .filter((post) => post.event_at && new Date(post.event_at).getTime() >= Date.now())
    .sort((a, b) => (a.event_at ?? "").localeCompare(b.event_at ?? ""))[0];

  return (
    <Link
      href="/favoritos"
      className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 text-sm hover:bg-chip"
    >
      <span className="inline-flex items-center gap-2">
        <Star size={14} strokeWidth={1.75} className="text-amber-500" />
        {favs.length} guardados
      </span>
      <span className="truncate text-xs text-muted">
        {next ? `Próximo: ${next.title} · ${formatEventWhen(next.event_at as string)}` : "Ver todos"}
      </span>
    </Link>
  );
}
