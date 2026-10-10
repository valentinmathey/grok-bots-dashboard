-- Scopes por clave. Default publish = el comportamiento actual.
-- Se permite más de una clave activa por bot (ej. n8n-experto + read:all).

alter table public.bot_api_keys
  add column if not exists scopes text[] not null default '{publish}';

alter table public.bot_api_keys
  drop constraint if exists bot_api_keys_scopes_ok;
alter table public.bot_api_keys
  add constraint bot_api_keys_scopes_ok
  check (
    cardinality(scopes) >= 1
    and scopes <@ array['publish', 'read:all']::text[]
  );

drop index if exists public.bot_api_keys_one_active_per_bot;

-- Sigue habiendo como máximo UNA clave activa con publish por bot
-- (regenerar revoca y crea; dos regeneraciones concurrentes no dejan dos activas).
-- Las claves read:all quedan fuera del índice, así conviven con la de publish.
create unique index if not exists bot_api_keys_one_active_publish_per_bot
  on public.bot_api_keys (bot_id)
  where revoked_at is null and scopes @> array['publish']::text[];
