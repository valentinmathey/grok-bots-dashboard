-- Agrega updated_at a posts (para editar publicaciones).
-- Producción: pegá este archivo en el SQL Editor de Supabase y ejecutaló,
-- o corré: supabase db push

alter table public.posts
  add column if not exists updated_at timestamptz;

update public.posts
set updated_at = created_at
where updated_at is null;

alter table public.posts
  alter column updated_at set default now();

alter table public.posts
  alter column updated_at set not null;

drop trigger if exists posts_set_updated_at on public.posts;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();
