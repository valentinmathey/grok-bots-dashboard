import Link from "next/link";
import { TimeStamp } from "@/components/TimeStamp";
import { botCardLead, formatPublicationCount } from "@/lib/format";
import type { BotSummary } from "@/lib/types";

export function BotCard({ bot }: { bot: BotSummary }) {
  const lead = botCardLead(bot);

  return (
    <Link
      href={`/bots/${bot.slug}`}
      className="surface group flex min-h-[168px] min-w-0 flex-col overflow-hidden rounded-3xl p-4 sm:p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-accent/40 active:translate-y-0"
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
          {formatPublicationCount(bot.post_count)}
        </span>
      </div>

      <div className="mt-auto min-w-0 pt-4">
        {lead.tone === "live" ? (
          <p className="flex items-start gap-2 text-sm leading-6">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            <span className="min-w-0 break-words text-foreground">{lead.text}</span>
          </p>
        ) : lead.tone === "latest" ? (
          <div className="min-w-0">
            {lead.label ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {lead.label}
              </p>
            ) : null}
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground">
              {lead.text}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">{lead.text}</p>
        )}
        {bot.last_activity_at ? (
          <p className="mt-2 text-xs text-muted">
            {lead.tone === "latest" ? "Publicada" : "Última actividad"}{" "}
            <TimeStamp iso={bot.last_activity_at} />
          </p>
        ) : null}
      </div>
    </Link>
  );
}
