import { StatCard } from "@/components/stats/StatCard";
import type { DomainInsights } from "@/lib/stats";

export function InsightsCard({
  domain,
  onHide,
}: {
  domain: DomainInsights;
  onHide?: () => void;
}) {
  const blocks: Array<{ title: string; rows: Array<[string, string]> }> = [];
  if (domain.eventsNext7 || domain.eventsNext30) {
    blocks.push({
      title: "Eventos",
      rows: [
        ["Próximos 7 días", String(domain.eventsNext7)],
        ["Próximos 30 días", String(domain.eventsNext30)],
      ],
    });
  }
  if (domain.alojamiento) {
    const stay = domain.alojamiento;
    const money = (value: number | null) =>
      value == null ? "—" : `${stay.currency} ${Math.round(value)}`;
    blocks.push({
      title: "Alojamientos",
      rows: [
        ["Listados", String(stay.count)],
        ["Mín pp", money(stay.minPp)],
        ["Máx pp", money(stay.maxPp)],
        ["Mediana pp", money(stay.medianPp)],
      ],
    });
  }
  if (domain.oportunidades) {
    blocks.push({
      title: "Oportunidades",
      rows: [
        ["Abiertas", String(domain.oportunidades.open)],
        ["Cerradas", String(domain.oportunidades.closed)],
        ["Sin fecha", String(domain.oportunidades.none)],
      ],
    });
  }
  if (domain.rankings) {
    blocks.push({
      title: "Rankings",
      rows: [
        ["Comparados", String(domain.rankings.count)],
        ["Bajaron de precio", String(domain.rankings.down)],
        ["Subieron", String(domain.rankings.up)],
      ],
    });
  }
  if (domain.informes || domain.workflowsActive || domain.requests) {
    blocks.push({
      title: "Operación",
      rows: [
        ...(domain.informes ? ([["Informes", String(domain.informes)]] as Array<[string, string]>) : []),
        ...(domain.workflowsActive
          ? ([["Workflows activos", String(domain.workflowsActive)]] as Array<[string, string]>)
          : []),
        ...(domain.requests ? ([["Pedidos", String(domain.requests)]] as Array<[string, string]>) : []),
      ],
    });
  }

  return (
    <StatCard
      title="Insights"
      subtitle="Solo se muestran dominios con datos"
      info="Precios y estados se leen de los details de cada post."
      empty={!blocks.length}
      onHide={onHide}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 content-center gap-3 min-[420px]:grid-cols-2">
        {blocks.map((block, index) => {
          const orphan = blocks.length % 2 === 1 && index === blocks.length - 1;
          return (
            <div
              key={block.title}
              className={`rounded-2xl bg-raised px-3 py-2.5 ${orphan ? "min-[420px]:col-span-2" : ""}`}
            >
              <p className="text-xs font-semibold">{block.title}</p>
              <dl className="mt-1.5 space-y-1.5">
                {block.rows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <dt className="min-w-0 text-muted">{label}</dt>
                    <dd className="shrink-0 whitespace-nowrap tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </StatCard>
  );
}
