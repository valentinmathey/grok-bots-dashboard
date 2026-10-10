import "server-only";

import { isPreviewMode } from "@/lib/env";
import {
  defaultPrefs,
  type NotificationPrefs,
  type PushSubscriptionRow,
  type PushType,
} from "@/lib/push-types";
import { createAdminClient } from "@/lib/supabase/admin";

const memory = {
  subscriptions: [] as PushSubscriptionRow[],
  prefs: defaultPrefs(),
  throttle: new Map<string, { count: number; window_start: number; last_title?: string }>(),
};

function rowFromDb(row: Record<string, unknown>): PushSubscriptionRow {
  return {
    id: String(row.id),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    auth: String(row.auth),
    user_agent: (row.user_agent as string | null) ?? null,
    created_at: String(row.created_at),
    last_success_at: (row.last_success_at as string | null) ?? null,
    failed_count: Number(row.failed_count ?? 0),
    disabled_at: (row.disabled_at as string | null) ?? null,
  };
}

function parsePrefs(raw: unknown): NotificationPrefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as { bots?: unknown; types?: unknown };
  if (value.bots && typeof value.bots === "object" && !Array.isArray(value.bots)) {
    for (const [key, on] of Object.entries(value.bots as Record<string, unknown>)) {
      if (typeof on === "boolean") base.bots[key] = on;
    }
  }
  if (value.types && typeof value.types === "object" && !Array.isArray(value.types)) {
    for (const [key, on] of Object.entries(value.types as Record<string, unknown>)) {
      if (typeof on === "boolean" && key in base.types) {
        base.types[key as PushType] = on;
      }
    }
  }
  return base;
}

export async function listSubscriptions(includeDisabled = false): Promise<PushSubscriptionRow[]> {
  if (isPreviewMode()) {
    return memory.subscriptions.filter((row) => includeDisabled || !row.disabled_at);
  }
  const admin = createAdminClient();
  let query = admin.from("push_subscriptions").select("*").order("created_at", { ascending: false });
  if (!includeDisabled) query = query.is("disabled_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => rowFromDb(row as Record<string, unknown>));
}

export async function upsertSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
}): Promise<PushSubscriptionRow> {
  const now = new Date().toISOString();
  if (isPreviewMode()) {
    const existing = memory.subscriptions.find((row) => row.endpoint === input.endpoint);
    if (existing) {
      existing.p256dh = input.p256dh;
      existing.auth = input.auth;
      existing.user_agent = input.user_agent ?? existing.user_agent;
      existing.disabled_at = null;
      existing.failed_count = 0;
      return existing;
    }
    const row: PushSubscriptionRow = {
      id: `sub_${memory.subscriptions.length + 1}`,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.user_agent ?? null,
      created_at: now,
      last_success_at: null,
      failed_count: 0,
      disabled_at: null,
    };
    memory.subscriptions.push(row);
    return row;
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.user_agent ?? null,
        disabled_at: null,
        failed_count: 0,
      },
      { onConflict: "endpoint" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return rowFromDb(data as Record<string, unknown>);
}

export async function disableSubscription(idOrEndpoint: string, gone = false) {
  if (isPreviewMode()) {
    const row = memory.subscriptions.find(
      (item) => item.id === idOrEndpoint || item.endpoint === idOrEndpoint,
    );
    if (row) {
      row.disabled_at = new Date().toISOString();
      if (gone) row.failed_count += 1;
    }
    return;
  }
  const admin = createAdminClient();
  const patch = {
    disabled_at: new Date().toISOString(),
    failed_count: gone ? undefined : undefined,
  };
  if (idOrEndpoint.startsWith("http")) {
    await admin.from("push_subscriptions").update(patch).eq("endpoint", idOrEndpoint);
    return;
  }
  await admin.from("push_subscriptions").update(patch).eq("id", idOrEndpoint);
}

export async function markSubscriptionSuccess(id: string) {
  const now = new Date().toISOString();
  if (isPreviewMode()) {
    const row = memory.subscriptions.find((item) => item.id === id);
    if (row) {
      row.last_success_at = now;
      row.failed_count = 0;
    }
    return;
  }
  const admin = createAdminClient();
  await admin
    .from("push_subscriptions")
    .update({ last_success_at: now, failed_count: 0 })
    .eq("id", id);
}

export async function getPrefs(): Promise<NotificationPrefs> {
  if (isPreviewMode()) return memory.prefs;
  const admin = createAdminClient();
  const { data, error } = await admin.from("notification_prefs").select("*").eq("id", "owner").maybeSingle();
  if (error) throw error;
  if (!data) return defaultPrefs();
  return parsePrefs({ bots: data.bots, types: data.types });
}

export async function savePrefs(prefs: NotificationPrefs): Promise<NotificationPrefs> {
  if (isPreviewMode()) {
    memory.prefs = prefs;
    return prefs;
  }
  const admin = createAdminClient();
  const { error } = await admin.from("notification_prefs").upsert({
    id: "owner",
    bots: prefs.bots,
    types: prefs.types,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return prefs;
}

export async function readThrottle(key: string) {
  if (isPreviewMode()) {
    return memory.throttle.get(key) ?? null;
  }
  const admin = createAdminClient();
  const { data } = await admin.from("push_throttle").select("*").eq("key", key).maybeSingle();
  if (!data) return null;
  return {
    count: Number(data.count ?? 0),
    window_start: new Date(String(data.window_start)).getTime(),
    last_title: (data.last_title as string | null) ?? undefined,
  };
}

export async function writeThrottle(
  key: string,
  value: { count: number; window_start: number; last_title?: string },
) {
  if (isPreviewMode()) {
    memory.throttle.set(key, value);
    return;
  }
  const admin = createAdminClient();
  await admin.from("push_throttle").upsert({
    key,
    count: value.count,
    window_start: new Date(value.window_start).toISOString(),
    last_title: value.last_title ?? null,
  });
}
