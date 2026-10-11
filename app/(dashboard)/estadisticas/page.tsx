import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { StatsFilters } from "@/components/stats/StatsFilters";
import { getRepository } from "@/lib/data";
import { listRequests } from "@/lib/requests";
import { buildStats } from "@/lib/stats";
import {
  DEFAULT_STATS_LAYOUT,
  parseStatsBots,
  parseStatsPeriod,
  statsSubtitle,
  type StatsQuery,
} from "@/lib/stats-layout";
import { readStatsLayout } from "@/lib/stats-preferences";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; bot?: string; bots?: string }>;
}) {
  const params = await searchParams;
  const days = parseStatsPeriod(params.days);
  const selectedBots = parseStatsBots(params.bots, params.bot);
  const query: StatsQuery = { days, bots: selectedBots };
  const repo = getRepository();
  const lookback = days === 0 ? 0 : days * 2;
  const [posts, bots, layout] = await Promise.all([
    repo.listStatsPosts(lookback),
    repo.listBots(),
    readStatsLayout().catch(() => DEFAULT_STATS_LAYOUT),
  ]);
  const filtered = selectedBots.length
    ? posts.filter((post) => selectedBots.includes(post.bot.slug))
    : posts;
  const selected = bots.filter((bot) => selectedBots.includes(bot.slug));
  const requests = await listRequests(
    selected.length === 1 ? { botId: selected[0]!.id } : {},
  ).catch(() => []);
  const stats = buildStats(filtered, days, new Date(), requests.length);

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)]">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1.5 text-sm text-muted">
          {statsSubtitle(bots, selectedBots, days)}
        </p>
      </div>
      <StatsFilters query={query} bots={bots} />
      {stats.bots.length === 0 && stats.kpis.every((item) => item.value === 0) ? (
        <p className="text-sm text-muted">Todavía no hay suficientes posts.</p>
      ) : (
        <StatsDashboard data={stats} initialLayout={layout} />
      )}
    </div>
  );
}
