-- Links públicos de solo lectura por bot (ej. alojamiento-brasil-2027).
-- El token crudo nunca se guarda: solo SHA-256. RLS sin políticas para anon.

create table if not exists public.bot_share_links (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint bot_share_links_hash_sha256 check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint bot_share_links_prefix_length check (
    char_length(token_prefix) between 4 and 16
  )
);

create index if not exists bot_share_links_active_hash_idx
  on public.bot_share_links (token_hash)
  where revoked_at is null;

create index if not exists bot_share_links_bot_id_idx
  on public.bot_share_links (bot_id);

alter table public.bot_share_links enable row level security;

revoke all on table public.bot_share_links from anon, authenticated;
grant all on table public.bot_share_links to service_role;
