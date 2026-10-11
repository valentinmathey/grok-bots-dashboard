"use client";

import { useRouter } from "next/navigation";
import { Doughnut } from "react-chartjs-2";
import { ChartFrame } from "@/components/stats/ChartFrame";
import { registerCharts } from "@/components/stats/chart-setup";
import { StatCard } from "@/components/stats/StatCard";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { kindColor, kindLabel } from "@/lib/format";

registerCharts();

export function KindsCard({
  kinds,
  onHide,
}: {
  kinds: Array<{ kind: string; count: number }>;
  onHide?: () => void;
}) {
  const theme = useChartTheme();
  const router = useRouter();
  const defaults = chartDefaults(theme);
  const total = kinds.reduce((sum, row) => sum + row.count, 0);
  const colors = kinds.map((row) => kindColor(row.kind));

  function openKind(index?: number) {
    const kind = index != null ? kinds[index]?.kind : null;
    if (kind) router.push(`/buscar?kind=${encodeURIComponent(kind)}`);
  }

  return (
    <StatCard
      title="Tipos"
      subtitle="Tocá un sector para filtrar en Buscar"
      info="El número del centro es el total de posts del período."
      empty={!kinds.length}
      onHide={onHide}
    >
      <div className="space-y-3">
        <div className="relative mx-auto w-full max-w-[200px]">
          <ChartFrame height={200}>
            <Doughnut
              data={{
                labels: kinds.map((row) => kindLabel(row.kind as never)),
                datasets: [
                  {
                    data: kinds.map((row) => row.count),
                    backgroundColor: colors,
                    borderColor: theme.card,
                    borderWidth: 2,
                    hoverOffset: 6,
                  },
                ],
              }}
              options={{
                ...defaults,
                cutout: "68%",
                interaction: { mode: "nearest", intersect: false },
                onHover(event, elements) {
                  const canvas = event.native?.target;
                  if (canvas instanceof HTMLCanvasElement) {
                    canvas.style.cursor = elements.length ? "pointer" : "default";
                  }
                },
                onClick: (_event, elements) => openKind(elements[0]?.index),
                plugins: {
                  ...defaults.plugins,
                  legend: { display: false },
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
          </ChartFrame>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums leading-none">{total}</p>
              <p className="mt-0.5 text-[11px] text-muted">posts</p>
            </div>
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {kinds.map((row, index) => (
            <li key={row.kind}>
              <button
                type="button"
                onClick={() => openKind(index)}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: colors[index] }}
                />
                <span className="font-medium text-foreground">
                  {kindLabel(row.kind as never)}
                </span>
                <span className="tabular-nums">{row.count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </StatCard>
  );
}
