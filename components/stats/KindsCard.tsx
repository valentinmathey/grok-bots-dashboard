"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { kindLabel } from "@/lib/format";

registerCharts();

const PALETTE = ["#0f766e", "#1d4ed8", "#c2410c", "#6d28d9", "#0e7490", "#a16207", "#a21caf", "#166534"];

export function KindsCard({
  kinds,
  collapsed,
  onToggleCollapse,
  onHide,
}: {
  kinds: Array<{ kind: string; count: number }>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const router = useRouter();
  const defaults = chartDefaults(theme);
  const total = kinds.reduce((sum, row) => sum + row.count, 0);
  const colors = useMemo(
    () => kinds.map((_, index) => PALETTE[index % PALETTE.length]!),
    [kinds],
  );

  return (
    <StatCard
      title="Tipos"
      subtitle="Tocá un sector para filtrar en Buscar"
      info="El número del centro es el total de posts del período."
      empty={!kinds.length}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onHide={onHide}
    >
      <div className="relative mx-auto h-56 w-full max-w-[260px]">
        <Doughnut
          data={{
            labels: kinds.map((row) => kindLabel(row.kind as never)),
            datasets: [
              {
                data: kinds.map((row) => row.count),
                backgroundColor: colors,
                borderColor: theme.card,
                borderWidth: 2,
              },
            ],
          }}
          options={{
            ...defaults,
            cutout: "68%",
            onClick: (_event, elements) => {
              const index = elements[0]?.index;
              const kind = index != null ? kinds[index]?.kind : null;
              if (kind) router.push(`/buscar?kind=${encodeURIComponent(kind)}`);
            },
            plugins: {
              ...defaults.plugins,
              tooltip: {
                ...defaults.plugins.tooltip,
                callbacks: {
                  label(ctx) {
                    const value = Number(ctx.raw ?? 0);
                    const pct = total ? Math.round((value / total) * 100) : 0;
                    return `${value} · ${pct}%`;
                  },
                },
              },
            },
            scales: undefined,
          }}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">{total}</p>
            <p className="text-[11px] text-muted">posts</p>
          </div>
        </div>
      </div>
    </StatCard>
  );
}
