-- Búsqueda full-text de posts (sin acentos + fuzzy en título). Solo service role.
-- Las extensiones van al schema `extensions` (convención de Supabase).
-- array_to_string/concat_ws no son immutable, así que todo el tsvector se arma
-- en una función immutable propia para poder usarlo en una columna generada.

create schema if not exists extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, ''));
$$;

create or replace function public.details_search_text(details jsonb)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select concat_ws(
    ' ',
    details->>'neighborhood',
    details->>'city',
    details->>'search_area',
    details->>'product_name',
    details->>'headline',
    details->>'workflow_name'
  );
$$;

create or replace function public.post_search_tsv(
  p_title text,
  p_product text,
  p_tags text[],
  p_body text,
  p_details jsonb
)
returns tsvector
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    setweight(to_tsvector('simple'::regconfig, public.f_unaccent(p_title)), 'A') ||
    setweight(
      to_tsvector(
        'simple'::regconfig,
        public.f_unaccent(coalesce(p_product, '') || ' ' || array_to_string(coalesce(p_tags, '{}'::text[]), ' '))
      ),
      'B'
    ) ||
    setweight(to_tsvector('simple'::regconfig, public.f_unaccent(left(coalesce(p_body, ''), 8000))), 'C') ||
    setweight(
      to_tsvector('simple'::regconfig, public.f_unaccent(public.details_search_text(coalesce(p_details, '{}'::jsonb)))),
      'D'
    );
$$;

alter table public.posts
  add column if not exists search_tsv tsvector
  generated always as (
    public.post_search_tsv(title, product, tags, body_markdown, details)
  ) stored;

create index if not exists posts_search_tsv_gin on public.posts using gin (search_tsv);
create index if not exists posts_title_trgm on public.posts using gin (title extensions.gin_trgm_ops);

revoke all on function public.f_unaccent(text) from anon, authenticated;
revoke all on function public.details_search_text(jsonb) from anon, authenticated;
revoke all on function public.post_search_tsv(text, text, text[], text, jsonb) from anon, authenticated;
