export const PUSH_TYPES = [
  "new_post",
  "price_drop",
  "event_tomorrow",
  "opportunity_closing",
  "daily_digest",
] as const;

export type PushType = (typeof PUSH_TYPES)[number];

export type NotificationPrefs = {
  bots: Record<string, boolean>;
  types: Record<PushType, boolean>;
};

export const DEFAULT_PUSH_TYPES: Record<PushType, boolean> = {
  new_post: true,
  price_drop: true,
  event_tomorrow: true,
  opportunity_closing: true,
  daily_digest: false,
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
  badge?: string;
};

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_success_at: string | null;
  failed_count: number;
  disabled_at: string | null;
};

export function defaultPrefs(): NotificationPrefs {
  return { bots: {}, types: { ...DEFAULT_PUSH_TYPES } };
}

export function isBotEnabled(prefs: NotificationPrefs, botId: string): boolean {
  return prefs.bots[botId] !== false;
}

export function setAllBots(prefs: NotificationPrefs, botIds: string[], on: boolean): NotificationPrefs {
  return { ...prefs, bots: { ...prefs.bots, ...Object.fromEntries(botIds.map((id) => [id, on])) } };
}

export function isTypeEnabled(prefs: NotificationPrefs, type: PushType): boolean {
  return prefs.types[type] !== false;
}
