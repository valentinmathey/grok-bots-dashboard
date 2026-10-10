import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { getRepository } from "@/lib/data";
import { kindLabel } from "@/lib/format";
import { listRequests } from "@/lib/requests";
import { buildStats } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; bot?: string }>;
}) {
  const params = await searchParams;
  const days = params.days === "90" ? 90 : 30;
  const repo = getRepository();
  const posts = await repo.listStatsPosts(days);
  const filtered = params.bot ? posts.filter((post) => post.bot.slug === params.bot) : posts;
  const selectedBot = filtered[0]?.bot ?? posts.find((post) => post.bot.slug === params.bot)?.bot;
  const requests = await listRequests(selectedBot ? { botId: selectedBot.id } : {}).catch(() => []);
  const stats = buildStats(filtered, days);
  stats.insights.requests = requests.length;
  const maxBar = Math.max(1, ...stats.bots.map((row) => row.posts));
  const href = (next: { days?: number; bot?: string | null }) => {
    const search = new URLSearchParams();
    const nextDays = next.days ?? days;
    const nextBot = next.bot === undefined ? params.bot : next.bot;
    if (nextDays === 90) search.set("days", "90");
    if (nextBot) search.set("bot", nextBot);
    const query = search.toString();
    return query ? `/estadisticas?${query}` : "/estadisticas";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1.5 text-sm text-muted">
          {selectedBot
            ? `${selectedBot.name}, últimos ${days} días.`
            : `Actividad de los bots, últimos ${days} días.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link href={href({ days: 30 })} className={`rounded-full px-3 py-1 text-xs ${days === 30 ? "bg-accent text-accent-ink" : "bg-chip"}`}>
            30 días
          </Link>
          <Link href={href({ days: 90 })} className={`rounded-full px-3 py-1 text-xs ${days === 90 ? "bg-accent text-accent-ink" : "bg-chip"}`}>
            90 días
          </Link>
          {params.bot ? (
            <Link href={href({ bot: null })} className="rounded-full bg-chip px-3 py-1 text-xs">
              Todos los bots
            </Link>
          ) : null}
        </div>
      </div>

      {stats.bots.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay suficientes posts.</p>
      ) : (
        <>
          <section className="surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold">Posts por bot</h2>
            <ul className="mt-3 space-y-2">
              {stats.bots.map((row) => (
                <li key={row.bot.id}>
                  <Link href={`/estadisticas?bot=${row.bot.slug}&days=${days}`} className="flex items-center gap-3">
                    <BotAvatar bot={row.bot} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{row.bot.name}</p>
                      <div className="mt-1 h-2 rounded-full bg-chip">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${(row.posts / maxBar) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-muted">
                      {row.posts} · {row.perWeek}/sem
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold">Por día</h2>
            <Sparkline days={stats.days} />
          </section>

          <section className="surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold">Horario (Argentina)</h2>
            <Heatmap cells={stats.heatmap} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="surface rounded-3xl p-4">
              <h2 className="text-sm font-semibold">Tipos</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {stats.kinds.map((row) => (
                  <li key={row.kind} className="flex justify-between">
                    <span>{kindLabel(row.kind)}</span>
                    <span className="tabular-nums text-muted">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface rounded-3xl p-4">
              <h2 className="text-sm font-semibold">Tags</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {stats.tags.map((row) => (
                  <li key={row.tag} className="flex justify-between">
                    <span>#{row.tag}</span>
                    <span className="tabular-nums text-muted">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="surface rounded-3xl p-4">
            <h2 className="text-sm font-semibold">Insights</h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <Stat label="Eventos" value={stats.insights.eventos} />
              <Stat label="Alojamientos" value={stats.insights.alojamientos} />
              <Stat label="Oport. abiertas" value={stats.insights.oportunidadesOpen} />
              <Stat label="Rankings" value={stats.insights.rankings} />
              <Stat label="Informes" value={stats.insights.informes} />
              <Stat label="Workflows activos" value={stats.insights.workflowsActive} />
              <Stat label="Pedidos" value={stats.insights.requests ?? 0} />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-raised px-3 py-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Sparkline({ days }: { days: ReturnType<typeof buildStats>["days"] }) {
  const totals = days.map((day) => Object.values(day.counts).reduce((sum, n) => sum + n, 0));
  const max = Math.max(1, ...totals);
  const width = 320;
  const height = 64;
  const path = totals
    .map((value, index) => {
      const x = totals.length === 1 ? 0 : (index / (totals.length - 1)) * width;
      const y = height - (value / max) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-16 w-full text-accent" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Heatmap({ cells }: { cells: ReturnType<typeof buildStats>["heatmap"] }) {
  const lookup = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, cell.count]));
  const max = Math.max(1, ...cells.map((cell) => cell.count));
  return (
    <div className="mt-3 overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="mb-1 grid grid-cols-[2rem_repeat(24,minmax(0,1fr))] gap-0.5 text-[9px] text-muted">
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center">
              {hour % 6 === 0 ? hour : ""}
            </span>
          ))}
        </div>
        {WEEKDAY_ORDER.map((weekday, index) => (
          <div key={weekday} className="mb-0.5 grid grid-cols-[2rem_repeat(24,minmax(0,1fr))] gap-0.5">
            <span className="text-[10px] text-muted">{WEEKDAYS[index]}</span>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = lookup.get(`${weekday}-${hour}`) ?? 0;
              const opacity = count === 0 ? 0.08 : 0.2 + (count / max) * 0.8;
              return (
                <span
                  key={hour}
                  title={`${WEEKDAYS[index]} ${hour}:00 · ${count}`}
                  className="h-3 rounded-[3px] bg-accent"
                  style={{ opacity }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
