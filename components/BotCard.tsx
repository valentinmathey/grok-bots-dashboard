import Link from "next/link";
import { Clock3, Newspaper } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { TimeStamp } from "@/components/TimeStamp";
import { resolveAvatar } from "@/lib/avatar";
import { botCardLead, formatEventWhen, formatPublicationCount } from "@/lib/format";
import type { BotSummary } from "@/lib/types";

export function BotCard({ bot }: { bot: BotSummary }) {
  const lead = botCardLead(bot);
  const avatar = resolveAvatar(bot);
  const leadText =
    lead.tone === "event" && bot.next_event_at
      ? `${lead.text} · ${formatEventWhen(bot.next_event_at)}`
      : lead.text;

  return (
    <Link
      href={`/bots/${bot.slug}`}
      className="bot-skin surface group relative flex h-full min-h-[176px] min-w-0 flex-col overflow-hidden rounded-3xl p-4 sm:p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
      style={{ "--bot-fill": avatar.fill } as React.CSSProperties}
    >
      <div className="bot-wash pointer-events-none absolute inset-x-0 top-0 h-24" />
      <div className="relative flex items-start gap-3">
        <BotAvatar bot={bot} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 min-h-[2.875rem] text-[1.15rem] font-semibold leading-tight tracking-tight">
              {bot.name}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium text-muted">
              <Newspaper size={12} strokeWidth={1.75} />
              {formatPublicationCount(bot.post_count)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted">
            {bot.description?.trim() || "\u00a0"}
          </p>
        </div>
      </div>

      <div className="relative mt-auto min-w-0 pt-4">
        <p className="min-h-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
          {lead.label || "\u00a0"}
        </p>
        <p className="mt-1 flex items-start gap-2 text-sm leading-6">
          {lead.tone === "live" ? (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
          ) : null}
          <span
            className={`line-clamp-2 min-h-12 min-w-0 flex-1 ${
              lead.tone === "empty" ? "text-muted" : "text-foreground"
            }`}
          >
            {leadText}
          </span>
        </p>
        <p className="mt-2 inline-flex min-h-5 items-center gap-1.5 text-xs text-muted">
          {bot.last_activity_at ? (
            <>
              <Clock3 size={12} strokeWidth={1.75} />
              {lead.tone === "latest" ? "Publicada" : "Última actividad"}{" "}
              <TimeStamp iso={bot.last_activity_at} />
            </>
          ) : (
            "\u00a0"
          )}
        </p>
      </div>
    </Link>
  );
}
