-- Rutinas que cada bot declara (qué publica y cuándo). RLS on, solo service role.

create table if not exists public.bot_routines (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  position int not null default 0,
  name text not null check (char_length(name) between 1 and 120),
  schedule_text text not null check (char_length(schedule_text) between 1 and 120),
  cron text check (cron is null or char_length(cron) <= 120),
  timezone text not null default 'America/Mendoza',
  summary text not null default '' check (char_length(summary) <= 500),
  kind text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists bot_routines_bot_idx on public.bot_routines (bot_id, position);

alter table public.bot_routines enable row level security;
revoke all on table public.bot_routines from anon, authenticated;
grant all on table public.bot_routines to service_role;
