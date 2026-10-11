"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Sheet } from "@/components/Sheet";
import { BotAvatar } from "@/components/BotAvatar";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { kindLabel } from "@/lib/format";
import { movingAverage } from "@/lib/stats-layout";
import type { BotStat, DayPost } from "@/lib/stats";

registerCharts();

export function ActivityByDayCard({
  days,
  bots,
  posts,
  collapsed,
  onToggleCollapse,
  onHide,
}: {
  days: Array<{ date: string; counts: Record<string, number> }>;
  bots: BotStat[];
  posts: DayPost[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const defaults = chartDefaults(theme);
  const [average, setAverage] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const labels = days.map((day) => day.date.slice(8));
  const totals = days.map((day) => Object.values(day.counts).reduce((sum, n) => sum + n, 0));

  const datasets = useMemo(() => {
    const series = bots.map((row) => ({
      label: row.bot.name,
      data: days.map((day) => day.counts[row.bot.slug] ?? 0),
      borderColor: row.color,
      backgroundColor: `${row.color}99`,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
    }));
    if (average) {
      series.push({
        label: "Media 7 días",
        data: movingAverage(totals, 7),
        borderColor: theme.ink,
        backgroundColor: "transparent",
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }
    return series;
  }, [average, bots, days, theme.ink, totals]);

  const dayPosts = posts.filter((post) => post.date === openDay);

  return (
    <StatCard
      title="Actividad por día"
      subtitle="Apilado por bot. Tocá un día para ver los posts."
      info="La media móvil de 7 días se calcula sobre el total diario."
      empty={!days.some((day) => Object.values(day.counts).some(Boolean))}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onHide={onHide}
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setAverage((value) => !value)}
          className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium ${
            average ? "bg-accent text-accent-ink" : "bg-chip"
          }`}
          aria-pressed={average}
        >
          Media 7 días
        </button>
      </div>
      <div className="h-56 w-full sm:h-64">
        <Line
          data={{ labels, datasets }}
          options={{
            ...defaults,
            onClick: (_event, elements) => {
              const index = elements[0]?.index;
              if (index != null && days[index]) setOpenDay(days[index]!.date);
            },
            plugins: {
              ...defaults.plugins,
              tooltip: {
                ...defaults.plugins.tooltip,
                callbacks: {
                  title(items) {
                    const index = items[0]?.dataIndex ?? 0;
                    return days[index]?.date ?? "";
                  },
                },
              },
            },
            scales: {
              ...defaults.scales,
              x: { ...defaults.scales.x, stacked: !average },
              y: { ...defaults.scales.y, stacked: !average },
            },
          }}
        />
      </div>
      <Sheet
        open={Boolean(openDay)}
        onClose={() => setOpenDay(null)}
        title={openDay ? formatDayTitle(openDay) : "Día"}
      >
        {dayPosts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Nada publicado ese día.</p>
        ) : (
          <ul className="space-y-2 pb-[env(safe-area-inset-bottom)]">
            {dayPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={`/bots/${post.bot.slug}#post-${post.id}`}
                  className="surface flex items-center gap-3 rounded-2xl px-3 py-2.5"
                >
                  <BotAvatar bot={post.bot} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium">{post.title}</span>
                    <span className="text-[11px] text-muted">{kindLabel(post.kind as never)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </StatCard>
  );
}

function formatDayTitle(ymd: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T12:00:00.000Z`));
}
