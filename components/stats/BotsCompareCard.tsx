"use client";

import { Line } from "react-chartjs-2";
import { ChartFrame } from "@/components/stats/ChartFrame";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import type { BotStat } from "@/lib/stats";

registerCharts();

export function BotsCompareCard({
  days,
  bots,
  onHide,
}: {
  days: Array<{ date: string; counts: Record<string, number> }>;
  bots: BotStat[];
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const defaults = chartDefaults(theme);

  return (
    <StatCard
      title="Comparativa de bots"
      subtitle="Actividad diaria de cada bot"
      info="Cada serie se puede ocultar desde la leyenda."
      empty={!bots.length}
      onHide={onHide}
    >
      <ChartFrame height={256}>
        <Line
          data={{
            labels: days.map((day) => day.date.slice(8)),
            datasets: bots.map((row) => ({
              label: row.bot.name,
              data: days.map((day) => day.counts[row.bot.slug] ?? 0),
              borderColor: row.color,
              backgroundColor: row.color,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 4,
            })),
          }}
          options={{
            ...defaults,
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
              x: {
                ticks: { color: theme.muted, font: { size: 10 }, maxRotation: 0 },
                grid: { color: theme.line },
                border: { display: false },
              },
              y: {
                beginAtZero: true,
                ticks: { color: theme.muted, font: { size: 10 } },
                grid: { color: theme.line },
                border: { display: false },
              },
            },
          }}
        />
      </ChartFrame>
    </StatCard>
  );
}
