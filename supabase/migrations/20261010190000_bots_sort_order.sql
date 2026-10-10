-- Orden manual de bots en el home (el dueño lo arrastra).
-- Prod: SQL Editor o supabase db push.

alter table public.bots
  add column if not exists sort_order integer not null default 0;

update public.bots b
set sort_order = sub.rn - 1
from (
  select id, row_number() over (order by name) as rn
  from public.bots
) sub
where b.id = sub.id;

create index if not exists bots_sort_order_idx
  on public.bots (sort_order, name);

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
  b.sort_order,
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
