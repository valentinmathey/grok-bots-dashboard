-- PREPARADA, NO APLICADA (pendiente OK de Valentín). Opcional: solo performance.
-- El upsert por details.source_id funciona sin esto; el índice acelera la búsqueda
-- (bot_id + details->>'source_id') que hace publish_post antes de insertar.
create index if not exists posts_bot_source_id_idx
  on public.posts (bot_id, (details->>'source_id'))
  where details ? 'source_id';
