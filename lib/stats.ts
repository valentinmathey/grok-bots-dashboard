import { resolveAvatar } from "@/lib/avatar";
import { asAlojamiento, asOportunidades, isOpportunityClosed } from "@/lib/details";
import { baCalendarDate } from "@/lib/event-time";
import { asInforme, asRanking, asWorkflow } from "@/lib/rich-details";
import { deltaPct, median, type StatsPeriod } from "@/lib/stats-layout";
import type { Bot, Post } from "@/lib/types";

export type StatsBot = Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;

export type BotStat = {
  bot: StatsBot;
  color: string;
  posts: number;
  lastAt: string | null;
  streak: number;
  perWeek: number;
  activeDays: number;
  perActiveDay: number;
};

export type DayPost = {
  id: string;
  title: string;
  date: string;
  kind: string;
  bot: StatsBot;
};

export type HeatCell = {
  weekday: number;
  hour: number;
  count: number;
  bot: string;
};

export function artParts(iso: string): { weekday: number; hour: number } {
  const art = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return { weekday: art.getUTCDay(), hour: art.getUTCHours() };
}

export function heatCellKey(weekday: number, hour: number, bot: string): string {
  return `${weekday}|${hour}|${bot}`;
}

export function parseHeatCellKey(key: string): { weekday: number; hour: number; bot: string } {
  const [weekday, hour, ...botParts] = key.split("|");
  return {
    weekday: Number(weekday),
    hour: Number(hour),
    bot: botParts.join("|"),
  };
}

export function filterHeatByBot(cells: HeatCell[], bot: string | null): HeatCell[] {
  return bot ? cells.filter((cell) => cell.bot === bot) : cells;
}

export type KpiPoint = {
  key: string;
  label: string;
  value: number;
  previous: number;
  delta: number | null;
  spark: number[];
  href?: string;
};

export type DomainInsights = {
  eventsNext7: number;
  eventsNext30: number;
  alojamiento: {
    count: number;
    minPp: number | null;
    maxPp: number | null;
    medianPp: number | null;
    currency: string;
  } | null;
  oportunidades: { open: number; closed: number; none: number } | null;
  rankings: { count: number; down: number; up: number; flat: number } | null;
  informes: number;
  workflowsActive: number;
  requests: number;
};

export type StatsSnapshot = {
  bots: BotStat[];
  days: Array<{ date: string; counts: Record<string, number> }>;
  kinds: Array<{ kind: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  heatmap: HeatCell[];
  insights: {
    eventos: number;
    alojamientos: number;
    oportunidadesOpen: number;
    rankings: number;
    informes: number;
    workflowsActive: number;
    requests?: number;
  };
  kpis: KpiPoint[];
  domain: DomainInsights;
  dayPosts: DayPost[];
  periodDays: number;
};

type PostRow = Post & { bot: StatsBot };

function inRange(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function dailyTotals(posts: PostRow[], start: Date, end: Date, predicate: (post: PostRow) => boolean) {
  const map = new Map<string, number>();
  for (let cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    map.set(baCalendarDate(new Date(cursor)), 0);
  }
  for (const post of posts) {
    if (!predicate(post)) continue;
    const day = baCalendarDate(new Date(post.created_at));
    if (!map.has(day)) continue;
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return [...map.values()];
}

export function buildStats(
  posts: PostRow[],
  days: StatsPeriod | number = 30,
  now = new Date(),
  requests = 0,
): StatsSnapshot {
  const period = days > 0 ? days : 90;
  const allTime = days <= 0;
  const currentStart = allTime
    ? new Date(0)
    : new Date(now.getTime() - period * 86_400_000);
  const prevStart = allTime
    ? new Date(now.getTime() - 180 * 86_400_000)
    : new Date(now.getTime() - period * 2 * 86_400_000);
  const prevEnd = allTime ? new Date(now.getTime() - 90 * 86_400_000) : currentStart;
  const current = posts.filter((post) => inRange(post.created_at, currentStart, now));
  const previous = posts.filter((post) => inRange(post.created_at, prevStart, prevEnd));
  const chartStart = allTime
    ? (() => {
        const first = current.reduce(
          (min, post) => Math.min(min, new Date(post.created_at).getTime()),
          now.getTime(),
        );
        const span = Math.min(180, Math.max(7, Math.ceil((now.getTime() - first) / 86_400_000)));
        return new Date(now.getTime() - span * 86_400_000);
      })()
    : currentStart;
  const chartDays = Math.max(
    1,
    Math.round((now.getTime() - chartStart.getTime()) / 86_400_000),
  );

  const byBot = new Map<string, BotStat>();
  for (const post of current) {
    const currentBot = byBot.get(post.bot.id) ?? {
      bot: post.bot,
      color: resolveAvatar(post.bot).fill,
      posts: 0,
      lastAt: null,
      streak: 0,
      perWeek: 0,
      activeDays: 0,
      perActiveDay: 0,
    };
    currentBot.posts += 1;
    if (!currentBot.lastAt || post.created_at > currentBot.lastAt) {
      currentBot.lastAt = post.created_at;
    }
    byBot.set(post.bot.id, currentBot);
  }
  for (const stat of byBot.values()) {
    stat.perWeek = Number((stat.posts / (chartDays / 7)).toFixed(1));
    const daysSet = new Set(
      current
        .filter((post) => post.bot.id === stat.bot.id)
        .map((post) => baCalendarDate(new Date(post.created_at))),
    );
    stat.activeDays = daysSet.size;
    stat.perActiveDay = daysSet.size
      ? Number((stat.posts / daysSet.size).toFixed(2))
      : 0;
    let streak = 0;
    const cursor = new Date(now);
    while (daysSet.has(baCalendarDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    stat.streak = streak;
  }

  const dayMap = new Map<string, Record<string, number>>();
  for (let i = chartDays - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dayMap.set(baCalendarDate(date), {});
  }
  for (const post of current) {
    const day = baCalendarDate(new Date(post.created_at));
    const row = dayMap.get(day);
    if (!row) continue;
    row[post.bot.slug] = (row[post.bot.slug] ?? 0) + 1;
  }

  const kindMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  const heat: HeatCell[] = [];
  const heatMap = new Map<string, number>();
  for (const post of current) {
    kindMap.set(post.kind, (kindMap.get(post.kind) ?? 0) + 1);
    for (const tag of post.tags) tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    const { weekday, hour } = artParts(post.created_at);
    const key = heatCellKey(weekday, hour, post.bot.slug);
    heatMap.set(key, (heatMap.get(key) ?? 0) + 1);
  }
  for (const [key, count] of heatMap) {
    const parsed = parseHeatCellKey(key);
    heat.push({ ...parsed, count });
  }

  let oportunidadesOpen = 0;
  let oportunidadesClosed = 0;
  let oportunidadesNone = 0;
  let workflowsActive = 0;
  const prices: number[] = [];
  let currency = "USD";
  let rankingDown = 0;
  let rankingUp = 0;
  let rankingFlat = 0;
  let eventsNext7 = 0;
  let eventsNext30 = 0;
  const upcomingHorizon7 = now.getTime() + 7 * 86_400_000;
  const upcomingHorizon30 = now.getTime() + 30 * 86_400_000;

  for (const post of current) {
    const opp = asOportunidades(post.details);
    if (opp) {
      for (const item of opp.items) {
        if (!item.deadline) oportunidadesNone += 1;
        else if (isOpportunityClosed(item.deadline, now)) oportunidadesClosed += 1;
        else oportunidadesOpen += 1;
      }
    }
    if (asWorkflow(post.details)?.status === "active") workflowsActive += 1;
    const stay = asAlojamiento(post.details);
    if (stay?.price_per_person != null) {
      prices.push(stay.price_per_person);
      if (stay.currency) currency = stay.currency;
    }
    const ranking = asRanking(post.details);
    if (ranking) {
      const currentPrice =
        ranking.offers?.[ranking.best_offer_index ?? 0]?.price ??
        ranking.offers?.[0]?.price;
      const previousPrice = ranking.previous_best_price;
      if (currentPrice != null && previousPrice != null) {
        if (currentPrice < previousPrice) rankingDown += 1;
        else if (currentPrice > previousPrice) rankingUp += 1;
        else rankingFlat += 1;
      } else {
        rankingFlat += 1;
      }
    }
    if (post.event_at) {
      const at = new Date(post.event_at).getTime();
      if (at >= now.getTime() && at <= upcomingHorizon7) eventsNext7 += 1;
      if (at >= now.getTime() && at <= upcomingHorizon30) eventsNext30 += 1;
    }
  }

  const alojamientos = current.filter((post) => post.kind === "alojamiento").length;
  const rankings = current.filter((post) => post.kind === "ranking").length;
  const informes = current.filter((post) => post.kind === "informe").length;
  const upcomingEvents = current.filter(
    (post) => post.event_at && new Date(post.event_at).getTime() >= now.getTime(),
  ).length;
  const prevUpcoming = previous.filter(
    (post) => post.event_at && new Date(post.event_at).getTime() >= prevStart.getTime(),
  ).length;
  const prevOpen = previous.reduce((sum, post) => {
    const opp = asOportunidades(post.details);
    return (
      sum +
      (opp?.items.filter((item) => !isOpportunityClosed(item.deadline, prevEnd)).length ?? 0)
    );
  }, 0);
  const prevAlojamientos = previous.filter((post) => post.kind === "alojamiento").length;
  const sparkWindowStart = new Date(now.getTime() - Math.min(chartDays, 14) * 86_400_000);

  const kpis: KpiPoint[] = [
    {
      key: "posts",
      label: "Posts",
      value: current.length,
      previous: previous.length,
      delta: deltaPct(current.length, previous.length),
      spark: dailyTotals(current, sparkWindowStart, now, () => true),
    },
    {
      key: "bots",
      label: "Bots activos",
      value: byBot.size,
      previous: new Set(previous.map((post) => post.bot.id)).size,
      delta: deltaPct(byBot.size, new Set(previous.map((post) => post.bot.id)).size),
      spark: dailyTotals(current, sparkWindowStart, now, () => true),
    },
    {
      key: "week",
      label: "Posts / sem",
      value: Number((current.length / (chartDays / 7)).toFixed(1)),
      previous: Number((previous.length / (period / 7)).toFixed(1)),
      delta: deltaPct(
        current.length / (chartDays / 7),
        previous.length / (period / 7),
      ),
      spark: dailyTotals(current, sparkWindowStart, now, () => true),
    },
    {
      key: "events",
      label: "Eventos próximos",
      value: upcomingEvents,
      previous: prevUpcoming,
      delta: deltaPct(upcomingEvents, prevUpcoming),
      spark: dailyTotals(current, sparkWindowStart, now, (post) => Boolean(post.event_at)),
      href: "/agenda",
    },
    {
      key: "ops",
      label: "Oport. abiertas",
      value: oportunidadesOpen,
      previous: prevOpen,
      delta: deltaPct(oportunidadesOpen, prevOpen),
      spark: dailyTotals(current, sparkWindowStart, now, (post) => post.kind === "oportunidades"),
    },
    {
      key: "stay",
      label: "Alojamientos",
      value: alojamientos,
      previous: prevAlojamientos,
      delta: deltaPct(alojamientos, prevAlojamientos),
      spark: dailyTotals(current, sparkWindowStart, now, (post) => post.kind === "alojamiento"),
    },
  ];

  return {
    bots: [...byBot.values()].sort((a, b) => b.posts - a.posts),
    days: [...dayMap.entries()].map(([date, counts]) => ({ date, counts })),
    kinds: [...kindMap.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
    tags: [...tagMap.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    heatmap: heat,
    insights: {
      eventos: current.filter((post) => post.kind === "evento" || post.event_at).length,
      alojamientos,
      oportunidadesOpen,
      rankings,
      informes,
      workflowsActive,
      requests,
    },
    kpis,
    domain: {
      eventsNext7,
      eventsNext30,
      alojamiento:
        alojamientos > 0
          ? {
              count: alojamientos,
              minPp: prices.length ? Math.min(...prices) : null,
              maxPp: prices.length ? Math.max(...prices) : null,
              medianPp: median(prices),
              currency,
            }
          : null,
      oportunidades:
        oportunidadesOpen + oportunidadesClosed + oportunidadesNone > 0
          ? { open: oportunidadesOpen, closed: oportunidadesClosed, none: oportunidadesNone }
          : null,
      rankings:
        rankings > 0
          ? { count: rankings, down: rankingDown, up: rankingUp, flat: rankingFlat }
          : null,
      informes,
      workflowsActive,
      requests,
    },
    dayPosts: current.map((post) => ({
      id: post.id,
      title: post.title,
      date: baCalendarDate(new Date(post.created_at)),
      kind: post.kind,
      bot: post.bot,
    })),
    periodDays: chartDays,
  };
}
