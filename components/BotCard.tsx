import Link from "next/link";
import { TimeStamp } from "@/components/TimeStamp";
import { formatCount } from "@/lib/format";
import type { BotSummary } from "@/lib/types";

export function BotCard({ bot }: { bot: BotSummary }) {
  const busy = Boolean(bot.status?.trim());

  return (
    <Link
      href={`/bots/${bot.slug}`}
      className="surface group flex min-h-[176px] flex-col rounded-3xl p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent/40 active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {bot.name}
          </h2>
          {bot.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">
              {bot.description}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
          {formatCount(bot.post_count, "post", "posts")}
        </span>
      </div>

      <div className="mt-auto pt-5">
        <p className="flex items-start gap-2 text-sm leading-6">
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${busy ? "bg-accent" : "bg-muted/50"}`}
            aria-hidden
          />
          <span className={busy ? "text-foreground" : "text-muted"}>
            {busy ? bot.status : "Sin estado por ahora"}
          </span>
        </p>
        <p className="mt-2 pl-4 text-xs text-muted">
          {bot.last_activity_at ? (
            <>
              Última actividad <TimeStamp iso={bot.last_activity_at} />
            </>
          ) : (
            "Todavía no publicó"
          )}
        </p>
      </div>
    </Link>
  );
}
