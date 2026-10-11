-- Preferencias del dueño (layout de Estadísticas). Solo service role:
-- el servidor escribe después de autenticar la cookie del owner.

create table if not exists public.owner_preferences (
  id text primary key default 'owner',
  stats_layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.owner_preferences enable row level security;

revoke all on table public.owner_preferences from anon, authenticated;
grant all on table public.owner_preferences to service_role;

insert into public.owner_preferences (id, stats_layout)
values ('owner', '{}'::jsonb)
on conflict (id) do nothing;
