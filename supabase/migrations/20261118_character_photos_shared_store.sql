-- 봄이·콩이·함께 사진 보관 (메타데이터). 원본 영상 테이블은 건드리지 않음.
create table if not exists public.character_photos (
  id text primary key,
  shelf text not null check (shelf in ('bomi', 'kongi', 'duo')),
  name text not null default '',
  note text not null default '',
  added_at timestamptz not null default now(),
  storage_path text not null,
  mime_type text not null default 'image/jpeg',
  updated_at timestamptz not null default now()
);

create index if not exists character_photos_shelf_added_idx
  on public.character_photos (shelf, added_at desc);

alter table public.character_photos enable row level security;

drop policy if exists character_photos_select_all on public.character_photos;
create policy character_photos_select_all
  on public.character_photos for select using (true);

drop policy if exists character_photos_insert_all on public.character_photos;
create policy character_photos_insert_all
  on public.character_photos for insert with check (true);

drop policy if exists character_photos_update_all on public.character_photos;
create policy character_photos_update_all
  on public.character_photos for update using (true) with check (true);

drop policy if exists character_photos_delete_all on public.character_photos;
create policy character_photos_delete_all
  on public.character_photos for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'character-photos',
  'character-photos',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/avif','image/jpg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists character_photos_storage_select on storage.objects;
create policy character_photos_storage_select
  on storage.objects for select
  using (bucket_id = 'character-photos');

drop policy if exists character_photos_storage_insert on storage.objects;
create policy character_photos_storage_insert
  on storage.objects for insert
  with check (bucket_id = 'character-photos');

drop policy if exists character_photos_storage_update on storage.objects;
create policy character_photos_storage_update
  on storage.objects for update
  using (bucket_id = 'character-photos')
  with check (bucket_id = 'character-photos');

drop policy if exists character_photos_storage_delete on storage.objects;
create policy character_photos_storage_delete
  on storage.objects for delete
  using (bucket_id = 'character-photos');
