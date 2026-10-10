-- Vista liviana para conteos. El dashboard agrega en servidor (cache ≤5 min).

create or replace view public.bot_post_counts as
select
  bot_id,
  count(*)::int as posts,
  max(created_at) as last_publish
from public.posts
group by bot_id;
