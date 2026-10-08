import Link from "next/link";
import { KindBadge } from "@/components/KindBadge";
import { TimeStamp } from "@/components/TimeStamp";
import type { Bot, Post } from "@/lib/types";

export function BotCard({
  bot,
  latestPost,
}: {
  bot: Bot;
  latestPost?: Pick<Post, "id" | "title" | "kind" | "created_at"> | null;
}) {
  return (
    <Link
      href={`/bots/${bot.slug}`}
      className="block rounded-2xl border border-line bg-card p-4 transition-colors hover:border-accent/40 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{bot.name}</h2>
        <span className="shrink-0 font-mono text-xs text-muted">/{bot.slug}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground/90">
        <span className="text-muted">En qué está · </span>
        {bot.status?.trim() ? bot.status : "Todavía no actualizó su estado"}
      </p>
      {latestPost ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <KindBadge kind={latestPost.kind} />
          <span className="min-w-0 truncate text-foreground/85">
            {latestPost.title}
          </span>
          <TimeStamp iso={latestPost.created_at} />
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Sin publicaciones todavía</p>
      )}
    </Link>
  );
}
