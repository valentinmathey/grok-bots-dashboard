-- Búsqueda full-text de posts (español + fuzzy). Solo service role.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

create or replace function public.f_unaccent(value text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', coalesce(value, ''));
$$;

create or replace function public.details_search_text(details jsonb)
returns text
language sql
immutable
parallel safe
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

alter table public.posts
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('simple', public.f_unaccent(title)), 'A') ||
    setweight(
      to_tsvector(
        'simple',
        public.f_unaccent(coalesce(product, '') || ' ' || array_to_string(coalesce(tags, '{}'::text[]), ' '))
      ),
      'B'
    ) ||
    setweight(to_tsvector('simple', public.f_unaccent(left(coalesce(body_markdown, ''), 8000))), 'C') ||
    setweight(to_tsvector('simple', public.f_unaccent(public.details_search_text(coalesce(details, '{}'::jsonb)))), 'D')
  ) stored;

create index if not exists posts_search_tsv_gin on public.posts using gin (search_tsv);
create index if not exists posts_title_trgm on public.posts using gin (title gin_trgm_ops);
