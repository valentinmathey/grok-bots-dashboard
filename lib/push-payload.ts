import { asAlojamiento, asOportunidades, hasPriceDrop } from "@/lib/details";
import { asRanking, rankingDropPct } from "@/lib/rich-details";
import type { PushPayload, PushType } from "@/lib/push-types";
import type { Bot, Post } from "@/lib/types";

export const NEW_POST_THROTTLE_MS = 10 * 60 * 1000;

export function postUrl(slug: string, postId: string): string {
  return `/bots/${slug}#post-${postId}`;
}

export function buildPushPayload(input: {
  type: PushType;
  bot: Pick<Bot, "id" | "name" | "slug">;
  post?: Post;
  extra?: string;
  count?: number;
}): PushPayload {
  const { type, bot, post, extra, count } = input;
  const url = post ? postUrl(bot.slug, post.id) : `/bots/${bot.slug}`;
  if (type === "price_drop") {
    return {
      title: `${bot.name} · bajó de precio`,
      body: extra || post?.title || "Un precio bajó",
      url,
      tag: `price-drop:${bot.slug}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
  }
  if (type === "event_tomorrow") {
    return {
      title: `Mañana · ${bot.name}`,
      body: extra || post?.title || "Hay un evento mañana",
      url,
      tag: `event-tomorrow:${post?.id ?? bot.slug}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
  }
  if (type === "opportunity_closing") {
    return {
      title: `Cierra pronto · ${bot.name}`,
      body: extra || post?.title || "Una oportunidad está por cerrar",
      url,
      tag: `opp-close:${post?.id ?? bot.slug}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
  }
  if (type === "daily_digest") {
    return {
      title: "Resumen del día",
      body: extra || `${count ?? 0} publicaciones nuevas`,
      url: "/",
      tag: "daily-digest",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
  }
  if (count && count > 1) {
    return {
      title: bot.name,
      body: `${bot.name} publicó ${count} posts`,
      url: `/bots/${bot.slug}`,
      tag: `new-post:${bot.slug}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    };
  }
  return {
    title: bot.name,
    body: post?.title || extra || "Hay un post nuevo",
    url,
    tag: `new-post:${bot.slug}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
}

export function classifyPublish(post: Post): {
  type: PushType;
  extra?: string;
} {
  if (post.kind === "alojamiento" && hasPriceDrop(asAlojamiento(post.details))) {
    return { type: "price_drop", extra: post.title };
  }
  if (post.kind === "ranking" || post.kind === "report") {
    const ranking = asRanking(post.details);
    const drop = ranking ? rankingDropPct(ranking) : null;
    if (drop != null) {
      return {
        type: "price_drop",
        extra: `${ranking?.product_name ?? post.title} bajó ${drop}%`,
      };
    }
  }
  return { type: "new_post" };
}

export function shouldThrottle(
  lastAt: number | null,
  now: number,
  windowMs = NEW_POST_THROTTLE_MS,
): boolean {
  if (lastAt == null) return false;
  return now - lastAt < windowMs;
}

export function closingOpportunities(post: Post, todayYmd: string, horizonYmd: string) {
  const details = asOportunidades(post.details);
  if (!details) return [];
  return details.items.filter((item) => {
    if (!item.deadline) return false;
    const day = item.deadline.slice(0, 10);
    return day >= todayYmd && day <= horizonYmd;
  });
}
