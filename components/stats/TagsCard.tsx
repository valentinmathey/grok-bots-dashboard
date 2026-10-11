"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { ChartFrame } from "@/components/stats/ChartFrame";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";

registerCharts();

export function TagsCard({
  tags,
  onHide,
}: {
  tags: Array<{ tag: string; count: number }>;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const router = useRouter();
  const defaults = chartDefaults(theme);
  const [limit, setLimit] = useState<10 | 20 | 0>(10);
  const visible = useMemo(
    () => (limit === 0 ? tags : tags.slice(0, limit)),
    [limit, tags],
  );

  return (
    <StatCard
      title="Tags"
      subtitle="Tocá una barra para buscar ese tag"
      info="El selector recorta el ranking; 'Todos' muestra el período completo."
      empty={!tags.length}
      onHide={onHide}
    >
      <ChipRow className="mb-2 shrink-0">
        {([10, 20, 0] as const).map((value) => (
          <FilterChip
            key={value}
            size="sm"
            selected={limit === value}
            onClick={() => setLimit(value)}
          >
            {value === 0 ? "Todos" : `Top ${value}`}
          </FilterChip>
        ))}
      </ChipRow>
      <ChartFrame fill height={Math.max(200, visible.length * 28)}>
        <Bar
          data={{
            labels: visible.map((row) => `#${row.tag}`),
            datasets: [
              {
                data: visible.map((row) => row.count),
                backgroundColor: theme.accent,
                borderRadius: 6,
                barThickness: 12,
              },
            ],
          }}
          options={{
            ...defaults,
            indexAxis: "y",
            onClick: (_event, elements) => {
              const index = elements[0]?.index;
              const tag = index != null ? visible[index]?.tag : null;
              if (tag) router.push(`/buscar?q=${encodeURIComponent(tag)}`);
            },
            plugins: {
              ...defaults.plugins,
              legend: { display: false },
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { color: theme.muted, font: { size: 10 } },
                grid: { color: theme.line },
                border: { display: false },
              },
              y: {
                ticks: { color: theme.ink, font: { size: 11 } },
                grid: { display: false },
                border: { display: false },
              },
            },
          }}
        />
      </ChartFrame>
    </StatCard>
  );
}
