import { baCalendarDate } from "@/lib/event-time";
import { postAudio } from "@/lib/post-audio";
import type { BotSummary, Post } from "@/lib/types";

export type DaySummaryBot = {
  bot: BotSummary;
  fresh: Post[];
};

export type DaySummary = {
  byBot: DaySummaryBot[];
  events: Array<{ post: Post; bot: BotSummary }>;
  audios: Array<{ post: Post; bot: BotSummary }>;
};

export function buildDaySummary(
  bots: BotSummary[],
  posts: Post[],
  since: Date,
  now = new Date(),
): DaySummary {
  const botById = new Map(bots.map((bot) => [bot.id, bot]));
  const today = baCalendarDate(now);
  const sinceMs = since.getTime();
  const fresh = new Map<string, Post[]>();
  const events: DaySummary["events"] = [];
  const audios: DaySummary["audios"] = [];
  for (const post of posts) {
    const bot = botById.get(post.bot_id);
    if (!bot) continue;
    if (Date.parse(post.created_at) > sinceMs) {
      fresh.set(bot.id, [...(fresh.get(bot.id) ?? []), post]);
    }
    if (post.event_at && baCalendarDate(post.event_at) === today) events.push({ post, bot });
    if (postAudio(post) && baCalendarDate(post.created_at) === today) audios.push({ post, bot });
  }
  const byCreated = (a: Post, b: Post) => b.created_at.localeCompare(a.created_at);
  return {
    byBot: [...fresh.entries()]
      .map(([id, list]) => ({ bot: botById.get(id) as BotSummary, fresh: list.sort(byCreated) }))
      .sort((a, b) => byCreated(a.fresh[0], b.fresh[0])),
    events: events.sort((a, b) => (a.post.event_at ?? "").localeCompare(b.post.event_at ?? "")),
    audios: audios.sort((a, b) => byCreated(a.post, b.post)),
  };
}
