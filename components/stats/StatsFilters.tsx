import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import {
  statsHref,
  type StatsPeriod,
  type StatsQuery,
} from "@/lib/stats-layout";

const PERIODS: Array<{ days: StatsPeriod; label: string }> = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 0, label: "Todo" },
];

export function StatsFilters({
  query,
  bots,
}: {
  query: StatsQuery;
  bots: Array<{
    name: string;
    slug: string;
    avatar_color?: string | null;
    avatar_url?: string | null;
  }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PERIODS.map((period) => (
          <Link
            key={period.days}
            href={statsHref(query, { days: period.days })}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${
              query.days === period.days
                ? "bg-accent text-accent-ink"
                : "bg-chip"
            }`}
          >
            {period.label}
          </Link>
        ))}
      </div>
      {bots.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={statsHref(query, { bots: [] })}
            className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${
              query.bots.length === 0 ? "bg-foreground text-background" : "bg-chip"
            }`}
          >
            Todos los bots
          </Link>
          {bots.map((bot) => {
            const active = query.bots.includes(bot.slug);
            const next = active
              ? query.bots.filter((slug) => slug !== bot.slug)
              : [...query.bots, bot.slug];
            return (
              <Link
                key={bot.slug}
                href={statsHref(query, { bots: next })}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm ${
                  active ? "bg-foreground text-background" : "bg-chip"
                }`}
              >
                <BotAvatar bot={bot} size="xs" />
                {bot.name}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
