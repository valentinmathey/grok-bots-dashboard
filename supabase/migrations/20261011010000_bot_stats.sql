-- Vista liviana para conteos. El dashboard agrega en servidor (cache ≤5 min).

create or replace view public.bot_post_counts as
select
  bot_id,
  count(*)::int as posts,
  max(created_at) as last_publish
from public.posts
group by bot_id;

-- Igual que bot_home: respeta RLS del que consulta y solo la lee el service role.
alter view public.bot_post_counts set (security_invoker = true);
revoke all on table public.bot_post_counts from anon, authenticated;
grant select on table public.bot_post_counts to service_role;
