import Link from "next/link";
import { Sparkline } from "@/components/stats/Sparkline";
import { StatCard } from "@/components/stats/StatCard";
import type { KpiPoint } from "@/lib/stats";

export function KpiStrip({
  items,
  onHide,
}: {
  items: KpiPoint[];
  onHide?: () => void;
}) {
  return (
    <StatCard
      title="Resumen"
      subtitle="Comparado con el período anterior"
      info="El delta es contra la ventana anterior de la misma duración. En 'Todo' se comparan los últimos 90 días contra los 90 previos."
      empty={items.every((item) => item.value === 0)}
      onHide={onHide}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const body = (
            <>
              <p className="text-[11px] text-muted">{item.label}</p>
              <p className="text-xl font-semibold tabular-nums">{formatKpi(item.value)}</p>
              <p
                className={`text-[11px] tabular-nums ${
                  item.delta == null
                    ? "text-muted"
                    : item.delta > 0
                      ? "text-accent"
                      : item.delta < 0
                        ? "text-danger"
                        : "text-muted"
                }`}
              >
                {item.delta == null
                  ? "sin base previa"
                  : `${item.delta > 0 ? "+" : ""}${item.delta}%`}
              </p>
              <Sparkline values={item.spark} className="mt-1 h-7 w-full text-accent" />
            </>
          );
          const className = "rounded-2xl bg-raised px-3 py-2.5";
          return item.href ? (
            <Link key={item.key} href={item.href} className={className}>
              {body}
            </Link>
          ) : (
            <div key={item.key} className={className}>
              {body}
            </div>
          );
        })}
      </div>
    </StatCard>
  );
}

function formatKpi(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
