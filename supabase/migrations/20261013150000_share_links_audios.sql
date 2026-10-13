-- Links para compartir también la sección Audios (scope 'audios', sin bot_id).

alter table public.bot_share_links
  add column if not exists scope text not null default 'bot',
  add column if not exists bot_ids uuid[];

alter table public.bot_share_links alter column bot_id drop not null;

alter table public.bot_share_links
  drop constraint if exists bot_share_links_scope_check;
alter table public.bot_share_links
  add constraint bot_share_links_scope_check check (
    (scope = 'bot' and bot_id is not null)
    or (scope = 'audios' and bot_id is null)
  );
