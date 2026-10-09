-- Fecha real del evento (distinta de created_at). Nullable: no hay backfill.
-- Producción: pegá este archivo en el SQL Editor de Supabase y ejecutaló,
-- o corré: supabase db push

alter table public.posts
  add column if not exists event_at timestamptz,
  add column if not exists event_end_at timestamptz;

alter table public.posts
  drop constraint if exists posts_event_range_ok;
alter table public.posts
  add constraint posts_event_range_ok
  check (
    event_end_at is null
    or (event_at is not null and event_end_at >= event_at)
  );

create index if not exists posts_bot_event_at_idx
  on public.posts (bot_id, event_at);

-- La vista no usa estas columnas; se recrea igual por si un entorno
-- viejo todavía tiene la definición anterior.
drop view if exists public.bot_home;

create view public.bot_home as
select
  b.id,
  b.name,
  b.slug,
  b.description,
  b.status,
  b.status_updated_at,
  b.created_at,
  b.updated_at,
  b.avatar_color,
  b.avatar_shape,
  b.avatar_url,
  coalesce(s.post_count, 0)::int as post_count,
  s.last_activity_at
from public.bots b
left join (
  select
    bot_id,
    count(*)::int as post_count,
    max(created_at) as last_activity_at
  from public.posts
  group by bot_id
) s on s.bot_id = b.id;

alter view public.bot_home set (security_invoker = true);

revoke all on table public.bot_home from anon, authenticated;
grant select on table public.bot_home to service_role;
