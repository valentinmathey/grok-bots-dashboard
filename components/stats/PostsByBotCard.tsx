"use client";

import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { formatRelative } from "@/lib/format";
import type { BotStat } from "@/lib/stats";

registerCharts();

export function PostsByBotCard({
  bots,
  collapsed,
  onToggleCollapse,
  onHide,
}: {
  bots: BotStat[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const router = useRouter();
  const defaults = chartDefaults(theme);

  return (
    <StatCard
      title="Posts por bot"
      subtitle="Tocá una barra para abrir el bot"
      info="Ancho proporcional al total del período. El color es el del avatar."
      empty={!bots.length}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onHide={onHide}
    >
      <div className="h-[min(360px,max(180px,calc(bots*44px)))] min-h-48" style={{ height: Math.max(180, bots.length * 44) }}>
        <Bar
          data={{
            labels: bots.map((row) => row.bot.name),
            datasets: [
              {
                label: "Posts",
                data: bots.map((row) => row.posts),
                backgroundColor: bots.map((row) => row.color),
                borderRadius: 8,
                barThickness: 18,
                maxBarThickness: 22,
              },
            ],
          }}
          options={{
            ...defaults,
            indexAxis: "y",
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
                  label(ctx) {
                    const row = bots[ctx.dataIndex];
                    if (!row) return "";
                    const last = row.lastAt ? `último ${formatRelative(row.lastAt)}` : "sin posts";
                    return `${row.posts} posts · ${row.perWeek}/sem · ${last}`;
                  },
                },
              },
            },
            scales: {
              ...defaults.scales,
              x: { ...defaults.scales.x, grace: "8%" },
              y: { ...defaults.scales.y, grid: { display: false } },
            },
          }}
        />
      </div>
    </StatCard>
  );
}
