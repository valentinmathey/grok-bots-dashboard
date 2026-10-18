-- Lista de seguimiento de productos (la carga el dueño; el bot la lee por MCP). RLS on, solo service role.

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  target_price numeric check (target_price is null or target_price >= 0),
  status text not null default 'siguiendo' check (status in ('siguiendo', 'comprado', 'no-por-ahora')),
  notes text not null default '' check (char_length(notes) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watchlist_items_bot_idx on public.watchlist_items (bot_id, created_at);

alter table public.watchlist_items enable row level security;
revoke all on table public.watchlist_items from anon, authenticated;
grant all on table public.watchlist_items to service_role;
