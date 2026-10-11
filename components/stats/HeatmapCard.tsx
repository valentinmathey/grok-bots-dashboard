"use client";

import { useMemo, useState, type PointerEvent } from "react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { StatCard } from "@/components/stats/StatCard";
import { useChartTheme } from "@/components/stats/useChartTheme";
import { filterHeatByBot, type BotStat, type HeatCell } from "@/lib/stats";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const WEEKDAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"] as const;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HeatmapCard({
  cells,
  bots,
  onHide,
}: {
  cells: HeatCell[];
  bots: BotStat[];
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const [bot, setBot] = useState<string | null>(null);
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);
  const filtered = useMemo(() => filterHeatByBot(cells, bot), [bot, cells]);
  const lookup = new Map<string, number>();
  for (const cell of filtered) {
    const key = `${cell.weekday}-${cell.hour}`;
    lookup.set(key, (lookup.get(key) ?? 0) + cell.count);
  }
  const max = Math.max(1, ...lookup.values());

  function showTip(event: PointerEvent<HTMLElement>, label: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 168;
    const height = 32;
    const x = Math.min(
      Math.max(8, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - 8,
    );
    const above = rect.top - height - 8;
    const y = above >= 8 ? above : Math.min(rect.bottom + 8, window.innerHeight - height - 8);
    setTip({ label, x, y });
  }

  return (
    <StatCard
      title="Horario (Argentina)"
      subtitle="Día × hora, en ART"
      info="La intensidad es la cantidad de posts publicados en esa hora."
      empty={!cells.length}
      onHide={onHide}
    >
      <ChipRow className="mb-2">
        <FilterChip size="sm" selected={!bot} onClick={() => setBot(null)}>
          Todos
        </FilterChip>
        {bots.map((row) => (
          <FilterChip
            key={row.bot.slug}
            size="sm"
            selected={bot === row.bot.slug}
            onClick={() => setBot(row.bot.slug === bot ? null : row.bot.slug)}
          >
            <BotAvatar bot={row.bot} size="xs" />
            <span className="min-w-0 truncate">{row.bot.name}</span>
          </FilterChip>
        ))}
      </ChipRow>
      <div className="w-full min-w-0">
        <div
          className="grid w-full gap-px"
          style={{ gridTemplateColumns: "1.25rem repeat(24, minmax(0, 1fr))" }}
        >
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center text-[9px] text-muted">
              {hour % 6 === 0 ? hour : ""}
            </span>
          ))}
          {WEEKDAY_ORDER.map((weekday, index) => (
            <div key={weekday} className="contents">
              <span className="truncate text-[10px] text-muted">
                <span className="sm:hidden">{WEEKDAY_SHORT[index]}</span>
                <span className="hidden sm:inline">{WEEKDAYS[index]}</span>
              </span>
              {Array.from({ length: 24 }, (_, hour) => {
                const count = lookup.get(`${weekday}-${hour}`) ?? 0;
                const t = count === 0 ? 0.08 : 0.18 + (count / max) * 0.82;
                const label = `${WEEKDAYS[index]} ${String(hour).padStart(2, "0")}:00 · ${count} posts`;
                return (
                  <span
                    key={hour}
                    className="h-3 min-w-0 rounded-[2px] sm:h-4"
                    style={{ background: theme.accent, opacity: t }}
                    onPointerEnter={(event) => showTip(event, label)}
                    onPointerMove={(event) => showTip(event, label)}
                    onPointerLeave={() => setTip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <span>Menos</span>
        {[0.12, 0.3, 0.5, 0.72, 0.95].map((opacity) => (
          <span
            key={opacity}
            className="h-3 w-5 shrink-0 rounded-sm"
            style={{ background: theme.accent, opacity }}
          />
        ))}
        <span>Más</span>
      </div>
      {tip ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-full border border-line bg-card px-2.5 py-1 text-[11px] text-foreground shadow-sm"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
        </div>
      ) : null}
    </StatCard>
  );
}
