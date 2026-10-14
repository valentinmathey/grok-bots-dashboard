import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { FilterToolbar } from "@/components/FilterToolbar";
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
    <div className="min-w-0 space-y-3">
      <ChipRow>
        {PERIODS.map((period) => (
          <FilterChip
            key={period.days}
            href={statsHref(query, { days: period.days })}
            selected={query.days === period.days}
          >
            {period.label}
          </FilterChip>
        ))}
      </ChipRow>
      {bots.length > 1 ? (
        <FilterToolbar applied={query.bots.length} title="Bots" clearHref={statsHref(query, { bots: [] })}>
          <ChipRow>
            <FilterChip href={statsHref(query, { bots: [] })} selected={query.bots.length === 0}>
              Todos los bots
            </FilterChip>
            {bots.map((bot) => {
              const active = query.bots.includes(bot.slug);
              const next = active
                ? query.bots.filter((slug) => slug !== bot.slug)
                : [...query.bots, bot.slug];
              return (
                <FilterChip
                  key={bot.slug}
                  href={statsHref(query, { bots: next })}
                  selected={active}
                  check
                >
                  <BotAvatar bot={bot} size="xs" />
                  <span className="min-w-0 truncate">{bot.name}</span>
                </FilterChip>
              );
            })}
          </ChipRow>
        </FilterToolbar>
      ) : null}
    </div>
  );
}
