import "server-only";

import webpush from "web-push";
import { after } from "next/server";
import { getVapidConfig } from "@/lib/env";
import { NEW_POST_THROTTLE_MS, buildPushPayload, classifyPublish, shouldThrottle } from "@/lib/push-payload";
import {
  disableSubscription,
  getPrefs,
  listSubscriptions,
  markSubscriptionSuccess,
  readThrottle,
  writeThrottle,
} from "@/lib/push-store";
import { isBotEnabled, isTypeEnabled, type PushPayload, type PushType } from "@/lib/push-types";
import type { Bot, Post } from "@/lib/types";

export type PushFilter = {
  type: PushType;
  botId?: string;
};

export async function sendPush(payload: PushPayload, filter?: PushFilter): Promise<{ sent: number }> {
  const vapid = getVapidConfig();
  if (!vapid) return { sent: 0 };

  const prefs = await getPrefs();
  if (filter?.type && !isTypeEnabled(prefs, filter.type)) return { sent: 0 };
  if (filter?.botId && !isBotEnabled(prefs, filter.botId)) return { sent: 0 };

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  const subs = await listSubscriptions();
  // El número del ícono lo pide el service worker a /api/admin/badge (con la
  // cookie de visita del Resumen); newPosts sirve de respaldo.
  const body = JSON.stringify(payload);
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
      );
      await markSubscriptionSuccess(sub.id);
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await disableSubscription(sub.id, true);
      } else {
        console.error("push: sendNotification falló", status ?? error);
      }
    }
  }
  return { sent };
}

export function schedulePush(task: () => Promise<void>) {
  try {
    // Devolver la promesa: si no, after() no espera y Vercel congela la
    // función antes de que salga el push.
    after(() =>
      task().catch((error) => {
        console.error("push: falló el envío post-publish", error);
      }),
    );
  } catch {
    void task().catch(() => undefined);
  }
}

export async function notifyPostChange(input: {
  bot: Pick<Bot, "id" | "name" | "slug">;
  post: Post;
}) {
  const vapid = getVapidConfig();
  if (!vapid) return;
  // Bot apagado en /notificaciones: ni push ni ventana de agrupado.
  if (!isBotEnabled(await getPrefs(), input.bot.id)) return;
  const classified = classifyPublish(input.post);
  if (classified.type === "new_post") {
    const key = `new_post:${input.bot.id}`;
    const now = Date.now();
    const prev = await readThrottle(key);
    if (prev && shouldThrottle(prev.window_start, now)) {
      await writeThrottle(key, {
        count: prev.count + 1,
        window_start: prev.window_start,
        last_title: input.post.title,
      });
      return;
    }
    const count = prev && now - prev.window_start >= NEW_POST_THROTTLE_MS && prev.count > 1
      ? prev.count
      : 1;
    await writeThrottle(key, { count: 1, window_start: now, last_title: input.post.title });
    const payload = buildPushPayload({
      type: "new_post",
      bot: input.bot,
      post: input.post,
      count,
    });
    await sendPush(payload, { type: "new_post", botId: input.bot.id });
    return;
  }
  const payload = buildPushPayload({
    type: classified.type,
    bot: input.bot,
    post: input.post,
    extra: classified.extra,
  });
  await sendPush(payload, { type: classified.type, botId: input.bot.id });
}
