-- 봄이·콩이 이모티콘 보관. 원본 영상·다른 목록은 건드리지 않음.
create table if not exists public.emoticon_items (
  id text primary key,
  shelf text not null check (shelf in ('bomi', 'kongi')),
  name text not null default '',
  note text not null default '',
  added_at timestamptz not null default now(),
  storage_path text not null,
  mime_type text not null default 'image/png',
  updated_at timestamptz not null default now()
);

create index if not exists emoticon_items_shelf_added_idx
  on public.emoticon_items (shelf, added_at desc);

alter table public.emoticon_items enable row level security;

drop policy if exists emoticon_items_select_all on public.emoticon_items;
create policy emoticon_items_select_all
  on public.emoticon_items for select using (true);

drop policy if exists emoticon_items_insert_all on public.emoticon_items;
create policy emoticon_items_insert_all
  on public.emoticon_items for insert with check (true);

drop policy if exists emoticon_items_update_all on public.emoticon_items;
create policy emoticon_items_update_all
  on public.emoticon_items for update using (true) with check (true);

drop policy if exists emoticon_items_delete_all on public.emoticon_items;
create policy emoticon_items_delete_all
  on public.emoticon_items for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'emoticon-files',
  'emoticon-files',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/avif','image/jpg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists emoticon_files_storage_select on storage.objects;
create policy emoticon_files_storage_select
  on storage.objects for select
  using (bucket_id = 'emoticon-files');

drop policy if exists emoticon_files_storage_insert on storage.objects;
create policy emoticon_files_storage_insert
  on storage.objects for insert
  with check (bucket_id = 'emoticon-files');

drop policy if exists emoticon_files_storage_update on storage.objects;
create policy emoticon_files_storage_update
  on storage.objects for update
  using (bucket_id = 'emoticon-files')
  with check (bucket_id = 'emoticon-files');

drop policy if exists emoticon_files_storage_delete on storage.objects;
create policy emoticon_files_storage_delete
  on storage.objects for delete
  using (bucket_id = 'emoticon-files');
