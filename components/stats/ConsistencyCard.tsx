"use client";

import { useRouter } from "next/navigation";
import { Bubble } from "react-chartjs-2";
import { ChartFrame } from "@/components/stats/ChartFrame";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { formatRelative } from "@/lib/format";
import { bubbleRadius } from "@/lib/stats-layout";
import type { BotStat } from "@/lib/stats";

registerCharts();

function withAlpha(hex: string, alpha = 0.72) {
  if (!hex.startsWith("#")) return hex;
  const raw = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  if (raw.length !== 7) return hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${raw}${a}`;
}

export function ConsistencyCard({
  bots,
  onHide,
}: {
  bots: BotStat[];
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const router = useRouter();
  const defaults = chartDefaults(theme);
  const maxPosts = Math.max(1, ...bots.map((row) => row.posts));

  return (
    <StatCard
      title="Constancia de los bots"
      subtitle="Tocá una burbuja para abrir el bot"
      info="X = días con al menos un post. Y = promedio por día activo. El radio es el total de posts."
      empty={!bots.length}
      onHide={onHide}
    >
      <ChartFrame height={280}>
        <Bubble
          data={{
            datasets: [
              {
                label: "Constancia",
                data: bots.map((row) => ({
                  x: row.activeDays,
                  y: row.perActiveDay,
                  r: bubbleRadius(row.posts, maxPosts),
                })),
                backgroundColor: bots.map((row) => withAlpha(row.color)),
                borderColor: bots.map((row) => row.color),
                borderWidth: 1.5,
              },
            ],
          }}
          options={{
            ...defaults,
            interaction: { mode: "nearest", intersect: true },
            onHover(event, elements) {
              const canvas = event.native?.target;
              if (canvas instanceof HTMLCanvasElement) {
                canvas.style.cursor = elements.length ? "pointer" : "default";
              }
            },
            onClick: (_event, elements) => {
              const index = elements[0]?.index;
              const slug = index != null ? bots[index]?.bot.slug : null;
              if (slug) router.push(`/bots/${slug}`);
            },
            plugins: {
              ...defaults.plugins,
              legend: { display: false },
              tooltip: {
                ...defaults.plugins.tooltip,
                callbacks: {
                  title(items) {
                    return bots[items[0]?.dataIndex ?? 0]?.bot.name ?? "";
                  },
                  label(ctx) {
                    const row = bots[ctx.dataIndex];
                    if (!row) return "";
                    const last = row.lastAt
                      ? `último ${formatRelative(row.lastAt)}`
                      : "sin posts";
                    return [
                      `${row.posts} posts`,
                      `${row.activeDays} días activos`,
                      `${row.perActiveDay} posts/día activo`,
                      last,
                    ];
                  },
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Días activos",
                  color: theme.muted,
                  font: { size: 11 },
                },
                ticks: { color: theme.muted, font: { size: 10 }, precision: 0 },
                grid: { color: theme.line },
                border: { display: false },
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Posts / día activo",
                  color: theme.muted,
                  font: { size: 11 },
                },
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
