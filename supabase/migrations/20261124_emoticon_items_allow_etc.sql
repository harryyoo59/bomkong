-- 기타 이모티콘(shelf = etc) 허용. 기존 봄이·콩이 데이터는 그대로.
alter table public.emoticon_items drop constraint if exists emoticon_items_shelf_check;
alter table public.emoticon_items
  add constraint emoticon_items_shelf_check
  check (shelf in ('bomi', 'kongi', 'etc'));

-- 움직이는 GIF 등 큰 그림도 올릴 수 있게
update storage.buckets
set file_size_limit = 20971520
where id = 'emoticon-files';
