import Link from "next/link";
import { CalendarPlus, Star } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { AGENDA_TYPE_LABEL, googleCalendarUrl, type AgendaEntry } from "@/lib/agenda";
import {
  formatAgendaDayHeading,
  formatAgendaTime,
  stripDateFromTitle,
} from "@/lib/calendar";
import { entryEmoji } from "@/lib/ics";

export function AgendaEventRow({ entry }: { entry: AgendaEntry }) {
  const time = formatAgendaTime(entry.startsAt, entry.allDay);
  const title = stripDateFromTitle(entry.title);
  const location = entry.location?.trim();

  return (
    <div className="surface flex items-start gap-3 rounded-2xl px-3 py-2.5">
      <BotAvatar bot={entry.bot} size="sm" className="mt-0.5 shrink-0" />
      <Link href={`/bots/${entry.bot.slug}#post-${entry.postId}`} className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-5">
          {time ? <span className="mr-1.5 font-medium text-muted">{time}</span> : null}
          {entry.favorite ? (
            <Star size={12} className="mr-1 inline -translate-y-px text-amber-500" />
          ) : null}
          {title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          <span className="rounded-full bg-chip px-2 py-0.5 font-medium">
            <span aria-hidden className="mr-1">
              {entryEmoji(entry)}
            </span>
            {AGENDA_TYPE_LABEL[entry.type]}
          </span>
          {location ? <span className="min-w-0 truncate">{location}</span> : null}
        </p>
      </Link>
      <a
        href={googleCalendarUrl(entry)}
        target="_blank"
        rel="noreferrer"
        aria-label="Agregar a Google Calendar"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-accent hover:bg-chip"
        data-no-collapse
      >
        <CalendarPlus size={18} strokeWidth={1.75} />
      </a>
    </div>
  );
}

export function AgendaDayGroups({
  entries,
  today,
  tomorrow,
}: {
  entries: AgendaEntry[];
  today: string;
  tomorrow: string;
}) {
  const groups = new Map<string, AgendaEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.date) ?? [];
    list.push(entry);
    groups.set(entry.date, list);
  }

  return (
    <div className="space-y-3">
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <h2 className="sticky top-[calc(env(safe-area-inset-top)+4rem)] z-10 bg-background/90 py-2 text-sm font-semibold backdrop-blur lg:top-0">
            {formatAgendaDayHeading(date, today, tomorrow)}
          </h2>
          <AgendaDayList entries={items} />
        </section>
      ))}
    </div>
  );
}

export function AgendaDayList({
  entries,
  empty = "Nada para este día.",
}: {
  entries: AgendaEntry[];
  empty?: string;
}) {
  if (!entries.length) {
    return <p className="px-1 py-6 text-center text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {entries.map((entry) => (
        <li key={entry.id}>
          <AgendaEventRow entry={entry} />
        </li>
      ))}
    </ul>
  );
}
