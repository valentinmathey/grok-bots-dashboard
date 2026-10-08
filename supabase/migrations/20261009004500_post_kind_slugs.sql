-- Convierte posts.kind de enum fijo a un slug corto en minúsculas.
-- Así se pueden publicar tipos nuevos (p. ej. "evento") sin otra migración.
--
-- Producción: pegá este archivo en el SQL Editor de Supabase y ejecutaló,
-- o corré: supabase db push

alter table public.posts
  alter column kind drop default;

alter table public.posts
  alter column kind type text using kind::text;

alter table public.posts
  alter column kind set default 'update';

alter table public.posts
  drop constraint if exists posts_kind_format;

alter table public.posts
  add constraint posts_kind_format
  check (kind ~ '^[a-z][a-z0-9-]{0,31}$');

drop type if exists public.post_kind;

create index if not exists posts_kind_idx on public.posts (kind);

create or replace view public.bot_home as
select
  b.id,
  b.name,
  b.slug,
  b.description,
  b.status,
  b.status_updated_at,
  b.created_at,
  b.updated_at,
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
