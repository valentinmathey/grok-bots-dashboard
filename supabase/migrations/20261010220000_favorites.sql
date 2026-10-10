-- Favoritos del dueño. RLS on, solo service role.

create table if not exists public.post_favorites (
  post_id uuid primary key references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  note text,
  constraint post_favorites_note_len check (note is null or char_length(note) <= 280)
);

create table if not exists public.post_item_favorites (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  item_key text not null,
  label text,
  url text,
  price_at_save numeric,
  created_at timestamptz not null default now(),
  constraint post_item_favorites_key_len check (char_length(item_key) between 1 and 160),
  constraint post_item_favorites_unique unique (post_id, item_key)
);

create index if not exists post_item_favorites_post_idx on public.post_item_favorites (post_id);

alter table public.post_favorites enable row level security;
alter table public.post_item_favorites enable row level security;
revoke all on table public.post_favorites from anon, authenticated;
revoke all on table public.post_item_favorites from anon, authenticated;
grant all on table public.post_favorites to service_role;
grant all on table public.post_item_favorites to service_role;
