-- "Ya me inscribí" del dueño en eventos. RLS on, solo service role.

create table if not exists public.post_registrations (
  post_id uuid primary key references public.posts (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.post_registrations enable row level security;
revoke all on table public.post_registrations from anon, authenticated;
grant all on table public.post_registrations to service_role;
