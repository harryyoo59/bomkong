-- 5번 미공개 영상실 목록. watch_items(원본 영상보기)는 건드리지 않음.
create table if not exists public.unreleased_items (
  id text primary key,
  lang text not null check (lang in ('ko', 'en')),
  name text not null default '',
  title text not null default '',
  note text not null default '',
  added_at timestamptz not null default now(),
  storage_path text,
  mime_type text not null default 'video/mp4',
  updated_at timestamptz not null default now()
);

create index if not exists unreleased_items_lang_added_idx
  on public.unreleased_items (lang, added_at desc);

alter table public.unreleased_items enable row level security;

drop policy if exists unreleased_items_select_all on public.unreleased_items;
create policy unreleased_items_select_all
  on public.unreleased_items for select using (true);

drop policy if exists unreleased_items_insert_all on public.unreleased_items;
create policy unreleased_items_insert_all
  on public.unreleased_items for insert with check (true);

drop policy if exists unreleased_items_update_all on public.unreleased_items;
create policy unreleased_items_update_all
  on public.unreleased_items for update using (true) with check (true);

drop policy if exists unreleased_items_delete_all on public.unreleased_items;
create policy unreleased_items_delete_all
  on public.unreleased_items for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'unreleased-videos',
  'unreleased-videos',
  true,
  104857600,
  array['video/mp4','video/quicktime','video/webm','video/x-m4v','application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists unreleased_videos_storage_select on storage.objects;
create policy unreleased_videos_storage_select
  on storage.objects for select
  using (bucket_id = 'unreleased-videos');

drop policy if exists unreleased_videos_storage_insert on storage.objects;
create policy unreleased_videos_storage_insert
  on storage.objects for insert
  with check (bucket_id = 'unreleased-videos');

drop policy if exists unreleased_videos_storage_update on storage.objects;
create policy unreleased_videos_storage_update
  on storage.objects for update
  using (bucket_id = 'unreleased-videos')
  with check (bucket_id = 'unreleased-videos');

drop policy if exists unreleased_videos_storage_delete on storage.objects;
create policy unreleased_videos_storage_delete
  on storage.objects for delete
  using (bucket_id = 'unreleased-videos');
