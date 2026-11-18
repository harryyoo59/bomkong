-- 4번 로고 관리. 원본 영상 테이블은 건드리지 않음.
create table if not exists public.logo_items (
  id text primary key,
  serial integer not null default 1,
  title text not null default '',
  blurb text not null default '',
  name text not null default '',
  note text not null default '',
  added_at timestamptz not null default now(),
  built_in boolean not null default false,
  storage_path text,
  mime_type text not null default 'image/png',
  width integer,
  height integer,
  updated_at timestamptz not null default now()
);

create index if not exists logo_items_serial_idx
  on public.logo_items (serial);

alter table public.logo_items enable row level security;

drop policy if exists logo_items_select_all on public.logo_items;
create policy logo_items_select_all
  on public.logo_items for select using (true);

drop policy if exists logo_items_insert_all on public.logo_items;
create policy logo_items_insert_all
  on public.logo_items for insert with check (true);

drop policy if exists logo_items_update_all on public.logo_items;
create policy logo_items_update_all
  on public.logo_items for update using (true) with check (true);

drop policy if exists logo_items_delete_all on public.logo_items;
create policy logo_items_delete_all
  on public.logo_items for delete using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logo-files',
  'logo-files',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/avif','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists logo_files_storage_select on storage.objects;
create policy logo_files_storage_select
  on storage.objects for select using (bucket_id = 'logo-files');

drop policy if exists logo_files_storage_insert on storage.objects;
create policy logo_files_storage_insert
  on storage.objects for insert with check (bucket_id = 'logo-files');

drop policy if exists logo_files_storage_update on storage.objects;
create policy logo_files_storage_update
  on storage.objects for update using (bucket_id = 'logo-files') with check (bucket_id = 'logo-files');

drop policy if exists logo_files_storage_delete on storage.objects;
create policy logo_files_storage_delete
  on storage.objects for delete using (bucket_id = 'logo-files');
