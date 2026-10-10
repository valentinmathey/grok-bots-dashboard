import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/env";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { buildPushPayload } from "@/lib/push-payload";
import { sendPush } from "@/lib/push";
import {
  disableSubscription,
  getPrefs,
  listSubscriptions,
  savePrefs,
  upsertSubscription,
} from "@/lib/push-store";
import { defaultPrefs, PUSH_TYPES, type NotificationPrefs, type PushType } from "@/lib/push-types";

export const dynamic = "force-dynamic";

async function requireOwner() {
  const owner = await getOwnerFromRequest();
  if (!owner) return null;
  return owner;
}

export async function GET() {
  if (!(await requireOwner())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({
      enabled: false,
      publicKey: null,
      prefs: defaultPrefs(),
      subscriptions: [],
    });
  }
  const [prefs, subscriptions] = await Promise.all([getPrefs(), listSubscriptions(true)]);
  return NextResponse.json({
    enabled: true,
    publicKey,
    prefs,
    subscriptions: subscriptions.map((row) => ({
      id: row.id,
      endpoint: row.endpoint,
      user_agent: row.user_agent,
      created_at: row.created_at,
      last_success_at: row.last_success_at,
      disabled_at: row.disabled_at,
    })),
  });
}

export async function POST(request: Request) {
  if (!(await requireOwner())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  if (!getVapidPublicKey()) {
    return jsonError(400, "not_configured", "Faltan las claves VAPID");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const data = body.data as {
    action?: string;
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    user_agent?: string;
    prefs?: NotificationPrefs;
    id?: string;
  };

  if (data.action === "test") {
    const result = await sendPush(
      buildPushPayload({
        type: "new_post",
        bot: { id: "test", name: "Grok Bots", slug: "home" },
        extra: "Prueba de notificación",
      }),
    );
    return NextResponse.json({ ok: true, sent: result.sent });
  }

  if (data.action === "prefs" && data.prefs) {
    const next = defaultPrefs();
    next.bots = data.prefs.bots ?? {};
    for (const type of PUSH_TYPES) {
      if (typeof data.prefs.types?.[type] === "boolean") {
        next.types[type as PushType] = data.prefs.types[type];
      }
    }
    const prefs = await savePrefs(next);
    return NextResponse.json({ prefs });
  }

  if (data.action === "unsubscribe" && data.id) {
    await disableSubscription(data.id);
    return NextResponse.json({ ok: true });
  }

  if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
    return jsonError(400, "invalid_input", "Faltan endpoint y keys");
  }
  const row = await upsertSubscription({
    endpoint: data.endpoint,
    p256dh: data.keys.p256dh,
    auth: data.keys.auth,
    user_agent: data.user_agent ?? request.headers.get("user-agent"),
  });
  return NextResponse.json({ id: row.id });
}
