-- Pedidos del dueño a un bot + hilo de respuestas.

create table if not exists public.bot_requests (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  item_key text,
  kind text not null default 'request',
  body text not null,
  status text not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  claimed_at timestamptz,
  answered_at timestamptz,
  unread boolean not null default false,
  constraint bot_requests_kind check (kind in ('comment', 'request')),
  constraint bot_requests_status check (status in ('pendiente', 'en_progreso', 'respondido', 'descartado')),
  constraint bot_requests_body_len check (char_length(body) between 1 and 2000)
);

create table if not exists public.bot_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.bot_requests (id) on delete cascade,
  author text not null,
  body text not null,
  linked_post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint bot_request_messages_author check (author in ('owner', 'bot')),
  constraint bot_request_messages_body_len check (char_length(body) between 1 and 8000)
);

create index if not exists bot_requests_bot_status_idx on public.bot_requests (bot_id, status);
create index if not exists bot_request_messages_req_idx on public.bot_request_messages (request_id);

alter table public.bot_requests enable row level security;
alter table public.bot_request_messages enable row level security;
revoke all on table public.bot_requests from anon, authenticated;
revoke all on table public.bot_request_messages from anon, authenticated;
grant all on table public.bot_requests to service_role;
grant all on table public.bot_request_messages to service_role;
