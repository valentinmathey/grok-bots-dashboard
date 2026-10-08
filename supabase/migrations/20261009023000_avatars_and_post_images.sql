-- Avatares de bots y fotos de posts (solo URLs externas; no hay Storage).
-- Producción: pegá este archivo en el SQL Editor de Supabase y ejecutaló,
-- o corré: supabase db push

alter table public.bots
  add column if not exists avatar_color text,
  add column if not exists avatar_shape text,
  add column if not exists avatar_url text;

alter table public.bots
  drop constraint if exists bots_avatar_color_ok;
alter table public.bots
  add constraint bots_avatar_color_ok
  check (
    avatar_color is null or avatar_color in (
      'maroon','black','brown','red','orange','yellow',
      'green','cyan','blue','violet','magenta','gray'
    )
  );

alter table public.bots
  drop constraint if exists bots_avatar_shape_ok;
alter table public.bots
  add constraint bots_avatar_shape_ok
  check (
    avatar_shape is null or avatar_shape in (
      'blob','squircle','hex','star','heart','shield','diamond','petal'
    )
  );

alter table public.bots
  drop constraint if exists bots_avatar_url_http;
alter table public.bots
  add constraint bots_avatar_url_http
  check (
    avatar_url is null
    or (
      char_length(avatar_url) between 8 and 2000
      and avatar_url ~* '^https?://'
    )
  );

alter table public.posts
  add column if not exists cover_image_url text,
  add column if not exists images jsonb not null default '[]'::jsonb;

alter table public.posts
  drop constraint if exists posts_cover_image_url_http;
alter table public.posts
  add constraint posts_cover_image_url_http
  check (
    cover_image_url is null
    or (
      char_length(cover_image_url) between 8 and 2000
      and cover_image_url ~* '^https?://'
    )
  );

alter table public.posts
  drop constraint if exists posts_images_array;
alter table public.posts
  add constraint posts_images_array
  check (
    jsonb_typeof(images) = 'array'
    and jsonb_array_length(images) <= 12
  );

-- Postgres no deja agregar columnas en el medio con CREATE OR REPLACE VIEW,
-- así que la vista se recrea.
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
