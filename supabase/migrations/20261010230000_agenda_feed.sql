-- Token hasheado para suscribir Google Calendar a /api/agenda.ics

create table if not exists public.agenda_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  token_prefix text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint agenda_feed_hash_sha256 check (token_hash ~ '^[0-9a-f]{64}$')
);

alter table public.agenda_feed_tokens enable row level security;
revoke all on table public.agenda_feed_tokens from anon, authenticated;
grant all on table public.agenda_feed_tokens to service_role;
