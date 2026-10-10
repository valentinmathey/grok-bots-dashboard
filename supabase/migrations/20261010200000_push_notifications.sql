-- Web Push: suscripciones del dueño y preferencias (un solo dueño).
-- RLS on, sin políticas para anon/authenticated. Solo service role.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  failed_count integer not null default 0,
  disabled_at timestamptz,
  constraint push_subscriptions_endpoint_len check (char_length(endpoint) between 8 and 2000),
  constraint push_subscriptions_p256dh_len check (char_length(p256dh) between 8 and 500),
  constraint push_subscriptions_auth_len check (char_length(auth) between 8 and 200)
);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (id)
  where disabled_at is null;

create table if not exists public.notification_prefs (
  id text primary key default 'owner',
  bots jsonb not null default '{}'::jsonb,
  types jsonb not null default '{
    "new_post": true,
    "price_drop": true,
    "event_tomorrow": true,
    "opportunity_closing": true,
    "daily_digest": false
  }'::jsonb,
  updated_at timestamptz not null default now(),
  constraint notification_prefs_id_owner check (id = 'owner')
);

insert into public.notification_prefs (id)
values ('owner')
on conflict (id) do nothing;

create table if not exists public.push_throttle (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  last_title text
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.push_throttle enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.notification_prefs from anon, authenticated;
revoke all on table public.push_throttle from anon, authenticated;
grant all on table public.push_subscriptions to service_role;
grant all on table public.notification_prefs to service_role;
grant all on table public.push_throttle to service_role;
