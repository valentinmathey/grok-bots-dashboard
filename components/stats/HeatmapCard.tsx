"use client";

import { useMemo, useState } from "react";
import { BotAvatar } from "@/components/BotAvatar";
import { StatCard } from "@/components/stats/StatCard";
import { useChartTheme } from "@/components/stats/useChartTheme";
import type { BotStat, HeatCell } from "@/lib/stats";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HeatmapCard({
  cells,
  bots,
  collapsed,
  onToggleCollapse,
  onHide,
}: {
  cells: HeatCell[];
  bots: BotStat[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const [bot, setBot] = useState<string | null>(null);
  const filtered = useMemo(
    () => (bot ? cells.filter((cell) => cell.bot === bot) : cells),
    [bot, cells],
  );
  const lookup = new Map<string, number>();
  for (const cell of filtered) {
    const key = `${cell.weekday}-${cell.hour}`;
    lookup.set(key, (lookup.get(key) ?? 0) + cell.count);
  }
  const max = Math.max(1, ...lookup.values());

  return (
    <StatCard
      title="Horario (Argentina)"
      subtitle="Día × hora, en ART"
      info="La intensidad es la cantidad de posts publicados en esa hora."
      empty={!cells.length}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onHide={onHide}
    >
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setBot(null)}
          className={`inline-flex min-h-9 items-center rounded-full px-2.5 text-xs ${
            !bot ? "bg-foreground text-background" : "bg-chip"
          }`}
        >
          Todos
        </button>
        {bots.map((row) => (
          <button
            key={row.bot.slug}
            type="button"
            onClick={() => setBot(row.bot.slug === bot ? null : row.bot.slug)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs ${
              bot === row.bot.slug ? "bg-foreground text-background" : "bg-chip"
            }`}
          >
            <BotAvatar bot={row.bot} size="xs" />
            {row.bot.name}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mb-1 grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-0.5 text-[9px] text-muted">
            <span />
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className="text-center">
                {hour % 6 === 0 ? hour : ""}
              </span>
            ))}
          </div>
          {WEEKDAY_ORDER.map((weekday, index) => (
            <div
              key={weekday}
              className="mb-0.5 grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-0.5"
            >
              <span className="text-[10px] text-muted">{WEEKDAYS[index]}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const count = lookup.get(`${weekday}-${hour}`) ?? 0;
                const t = count === 0 ? 0.08 : 0.18 + (count / max) * 0.82;
                return (
                  <span
                    key={hour}
                    title={`${WEEKDAYS[index]} ${String(hour).padStart(2, "0")}:00 · ${count} posts`}
                    className="h-3.5 rounded-[3px] sm:h-4"
                    style={{ background: theme.accent, opacity: t }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
        <span>Menos</span>
        {[0.12, 0.3, 0.5, 0.72, 0.95].map((opacity) => (
          <span
            key={opacity}
            className="h-3 w-5 rounded-sm"
            style={{ background: theme.accent, opacity }}
          />
        ))}
        <span>Más</span>
      </div>
    </StatCard>
  );
}
