import "server-only";

import { addCalendarDays, baCalendarDate } from "@/lib/event-time";
import { buildPushPayload, closingOpportunities } from "@/lib/push-payload";
import { sendPush } from "@/lib/push";
import { getPrefs } from "@/lib/push-store";
import { isBotEnabled, isTypeEnabled } from "@/lib/push-types";
import type { BotsRepository } from "@/lib/publishing";

export async function runDailyPushAlerts(repo: BotsRepository, now = new Date()) {
  const prefs = await getPrefs();
  const bots = await repo.listBots();
  const posts = await repo.listPostsForSummary(now);
  const today = baCalendarDate(now);
  const tomorrow = addCalendarDays(today, 1);
  const horizon = addCalendarDays(today, 2);
  const botById = new Map(bots.map((bot) => [bot.id, bot]));
  let sent = 0;

  if (isTypeEnabled(prefs, "event_tomorrow")) {
    for (const post of posts) {
      if (!post.event_at) continue;
      const bot = botById.get(post.bot_id);
      if (!bot || !isBotEnabled(prefs, bot.id)) continue;
      if (baCalendarDate(new Date(post.event_at)) !== tomorrow) continue;
      const result = await sendPush(
        buildPushPayload({
          type: "event_tomorrow",
          bot,
          post,
        }),
        { type: "event_tomorrow", botId: bot.id },
      );
      sent += result.sent;
    }
  }

  if (isTypeEnabled(prefs, "opportunity_closing")) {
    for (const post of posts) {
      if (post.kind !== "oportunidades") continue;
      const bot = botById.get(post.bot_id);
      if (!bot || !isBotEnabled(prefs, bot.id)) continue;
      const closing = closingOpportunities(post, today, horizon);
      if (!closing.length) continue;
      const result = await sendPush(
        buildPushPayload({
          type: "opportunity_closing",
          bot,
          post,
          extra: closing.map((item) => item.name).slice(0, 3).join(" · "),
        }),
        { type: "opportunity_closing", botId: bot.id },
      );
      sent += result.sent;
    }
  }

  if (isTypeEnabled(prefs, "daily_digest")) {
    const since = now.getTime() - 24 * 3600_000;
    const recent = posts.filter(
      (post) => post.kind !== "resumen" && new Date(post.created_at).getTime() >= since,
    );
    if (recent.length) {
      const result = await sendPush(
        buildPushPayload({
          type: "daily_digest",
          bot: bots[0] ?? { id: "home", name: "Grok Bots", slug: "home" },
          extra: `${recent.length} publicaciones en las últimas 24 h`,
          count: recent.length,
        }),
        { type: "daily_digest" },
      );
      sent += result.sent;
    }
  }

  return { sent };
}
