-- Dashboard privado de Grok Bots.
-- RLS queda activo en todas las tablas y no hay políticas para anon/authenticated:
-- el acceso a datos es solo con la service role desde el servidor, después de
-- autenticar al dueño (cookie) o al bot (Bearer API key).

create type public.post_kind as enum ('update', 'result', 'report', 'note');

create table public.bots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text,
  status_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bots_name_length check (char_length(name) between 1 and 80),
  constraint bots_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint bots_slug_length check (char_length(slug) between 2 and 64),
  constraint bots_description_length check (
    description is null or char_length(description) <= 500
  ),
  constraint bots_status_length check (
    status is null or char_length(status) <= 280
  )
);

create table public.bot_api_keys (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bot_api_keys_hash_sha256 check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint bot_api_keys_prefix_length check (char_length(key_prefix) between 4 and 16)
);

create unique index bot_api_keys_one_active_per_bot
  on public.bot_api_keys (bot_id)
  where revoked_at is null;

create index bot_api_keys_active_hash_idx
  on public.bot_api_keys (key_hash)
  where revoked_at is null;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  title text not null,
  body_markdown text not null,
  kind public.post_kind not null default 'update',
  product text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  constraint posts_title_length check (char_length(title) between 1 and 200),
  constraint posts_body_length check (char_length(body_markdown) between 1 and 100000),
  constraint posts_product_length check (
    product is null or char_length(product) between 1 and 80
  ),
  constraint posts_tags_limit check (cardinality(tags) <= 12)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_bot_id_created_at_idx on public.posts (bot_id, created_at desc);
create index posts_product_idx on public.posts (product);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bots_set_updated_at
  before update on public.bots
  for each row
  execute function public.set_updated_at();

alter table public.bots enable row level security;
alter table public.bot_api_keys enable row level security;
alter table public.posts enable row level security;

revoke all on table public.bots from anon, authenticated;
revoke all on table public.bot_api_keys from anon, authenticated;
revoke all on table public.posts from anon, authenticated;

grant all on table public.bots to service_role;
grant all on table public.bot_api_keys to service_role;
grant all on table public.posts to service_role;
