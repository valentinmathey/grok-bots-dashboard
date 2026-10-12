-- Bucket público para audios de posts (newsletter hablada, etc.). Solo audio, máx 20 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-audio',
  'post-audio',
  true,
  20971520,
  array['audio/mpeg','audio/mp3','audio/mp4','audio/x-m4a','audio/m4a','audio/aac','audio/ogg','audio/opus','audio/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
