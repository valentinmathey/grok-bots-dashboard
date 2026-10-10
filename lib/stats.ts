import { asAlojamiento, asOportunidades, isOpportunityClosed } from "@/lib/details";
import { asInforme, asRanking, asWorkflow } from "@/lib/rich-details";
import { baCalendarDate } from "@/lib/event-time";
import type { Bot, Post } from "@/lib/types";

export type BotStat = {
  bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color">;
  posts: number;
  lastAt: string | null;
  streak: number;
  perWeek: number;
};

export type StatsSnapshot = {
  bots: BotStat[];
  days: Array<{ date: string; counts: Record<string, number> }>;
  kinds: Array<{ kind: string; count: number }>;
  tags: Array<{ tag: string; count: number }>;
  heatmap: Array<{ weekday: number; hour: number; count: number }>;
  insights: {
    eventos: number;
    alojamientos: number;
    oportunidadesOpen: number;
    rankings: number;
    informes: number;
    workflowsActive: number;
    requests?: number;
  };
};

export function buildStats(
  posts: Array<Post & { bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color"> }>,
  days = 30,
  now = new Date(),
): StatsSnapshot {
  const since = now.getTime() - days * 86_400_000;
  const recent = posts.filter((post) => new Date(post.created_at).getTime() >= since);
  const byBot = new Map<string, BotStat>();
  for (const post of recent) {
    const current = byBot.get(post.bot.id) ?? {
      bot: post.bot,
      posts: 0,
      lastAt: null,
      streak: 0,
      perWeek: 0,
    };
    current.posts += 1;
    if (!current.lastAt || post.created_at > current.lastAt) current.lastAt = post.created_at;
    byBot.set(post.bot.id, current);
  }
  for (const stat of byBot.values()) {
    stat.perWeek = Number((stat.posts / (days / 7)).toFixed(1));
    const daysSet = new Set(
      recent
        .filter((post) => post.bot.id === stat.bot.id)
        .map((post) => baCalendarDate(new Date(post.created_at))),
    );
    let streak = 0;
    const cursor = new Date(now);
    while (daysSet.has(baCalendarDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    stat.streak = streak;
  }

  const dayMap = new Map<string, Record<string, number>>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dayMap.set(baCalendarDate(date), {});
  }
  for (const post of recent) {
    const day = baCalendarDate(new Date(post.created_at));
    const row = dayMap.get(day);
    if (!row) continue;
    row[post.bot.slug] = (row[post.bot.slug] ?? 0) + 1;
  }

  const kindMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  const heat = new Map<string, number>();
  for (const post of recent) {
    kindMap.set(post.kind, (kindMap.get(post.kind) ?? 0) + 1);
    for (const tag of post.tags) tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    const created = new Date(post.created_at);
    const art = new Date(created.getTime() - 3 * 3600_000);
    const key = `${art.getUTCDay()}-${art.getUTCHours()}`;
    heat.set(key, (heat.get(key) ?? 0) + 1);
  }

  let oportunidadesOpen = 0;
  let workflowsActive = 0;
  for (const post of recent) {
    const opp = asOportunidades(post.details);
    if (opp) {
      oportunidadesOpen += opp.items.filter((item) => !isOpportunityClosed(item.deadline, now)).length;
    }
    if (asWorkflow(post.details)?.status === "active") workflowsActive += 1;
    void asAlojamiento(post.details);
    void asRanking(post.details);
    void asInforme(post.details);
  }

  return {
    bots: [...byBot.values()].sort((a, b) => b.posts - a.posts),
    days: [...dayMap.entries()].map(([date, counts]) => ({ date, counts })),
    kinds: [...kindMap.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
    tags: [...tagMap.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    heatmap: [...heat.entries()].map(([key, count]) => {
      const [weekday, hour] = key.split("-").map(Number);
      return { weekday, hour, count };
    }),
    insights: {
      eventos: recent.filter((post) => post.kind === "evento" || post.event_at).length,
      alojamientos: recent.filter((post) => post.kind === "alojamiento").length,
      oportunidadesOpen,
      rankings: recent.filter((post) => post.kind === "ranking").length,
      informes: recent.filter((post) => post.kind === "informe").length,
      workflowsActive,
    },
  };
}
