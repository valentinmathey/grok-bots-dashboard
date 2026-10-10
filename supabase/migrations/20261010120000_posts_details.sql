-- details jsonb por post (alojamiento, resumen u objeto libre).
-- Nullable-safe: default {} , sin backfill. Prod: SQL Editor o supabase db push.

alter table public.posts
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.posts
  drop constraint if exists posts_details_object;
alter table public.posts
  add constraint posts_details_object
  check (jsonb_typeof(details) = 'object');

create index if not exists posts_kind_created_idx
  on public.posts (kind, created_at desc);

create index if not exists posts_details_week_key_idx
  on public.posts ((details->>'week_key'))
  where kind = 'resumen';

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
