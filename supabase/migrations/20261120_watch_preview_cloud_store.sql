-- 영상보기 미리보기 파일을 인터넷에도 남김
alter table public.watch_items
  add column if not exists preview_storage_path text,
  add column if not exists preview_mime_type text not null default 'video/mp4';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'watch-previews',
  'watch-previews',
  true,
  104857600,
  array['video/mp4','video/quicktime','video/webm','video/x-m4v','application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists watch_previews_storage_select on storage.objects;
create policy watch_previews_storage_select
  on storage.objects for select
  using (bucket_id = 'watch-previews');

drop policy if exists watch_previews_storage_insert on storage.objects;
create policy watch_previews_storage_insert
  on storage.objects for insert
  with check (bucket_id = 'watch-previews');

drop policy if exists watch_previews_storage_update on storage.objects;
create policy watch_previews_storage_update
  on storage.objects for update
  using (bucket_id = 'watch-previews')
  with check (bucket_id = 'watch-previews');

drop policy if exists watch_previews_storage_delete on storage.objects;
create policy watch_previews_storage_delete
  on storage.objects for delete
  using (bucket_id = 'watch-previews');

create or replace function public.replace_watch_catalog(p_items jsonb, p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
  elem jsonb;
  out_items jsonb := '[]'::jsonb;
  ep int;
begin
  select write_secret into expected from public.watch_write_guard where id = 1;
  if expected is null or p_secret is distinct from expected then
    raise exception 'forbidden';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_items';
  end if;

  delete from public.watch_items where true;

  for elem in select * from jsonb_array_elements(p_items)
  loop
    ep := coalesce((elem->>'episodeNumber')::int, (elem->>'episode_number')::int, 0);
    if ep < 0 then
      ep := 0;
    end if;
    insert into public.watch_items (
      id, name, title, youtube_url, note, added_at, episode_number, lang,
      preview_storage_path, preview_mime_type, updated_at
    ) values (
      coalesce(elem->>'id', gen_random_uuid()::text),
      coalesce(elem->>'name', ''),
      coalesce(elem->>'title', ''),
      coalesce(elem->>'youtubeUrl', elem->>'youtube_url', ''),
      coalesce(elem->>'note', ''),
      coalesce((elem->>'addedAt')::timestamptz, (elem->>'added_at')::timestamptz, now()),
      ep,
      case when elem->>'lang' = 'en' then 'en' else 'ko' end,
      nullif(trim(coalesce(elem->>'previewStoragePath', elem->>'preview_storage_path', '')), ''),
      coalesce(nullif(trim(coalesce(elem->>'previewMimeType', elem->>'preview_mime_type', '')), ''), 'video/mp4'),
      now()
    );
  end loop;

  select coalesce(jsonb_agg(to_jsonb(w) order by w.episode_number, w.lang), '[]'::jsonb)
    into out_items
  from public.watch_items w;

  return out_items;
end;
$$;

revoke all on function public.replace_watch_catalog(jsonb, text) from public;
grant execute on function public.replace_watch_catalog(jsonb, text) to anon, authenticated;
