-- 댓글쓰기: 인터넷 보관함에 남겨 올려도 안 사라지게
create table if not exists public.guest_comments (
  id text primary key,
  name text not null default '',
  message text not null,
  created_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

alter table public.guest_comments enable row level security;

drop policy if exists guest_comments_select_all on public.guest_comments;
create policy guest_comments_select_all
  on public.guest_comments for select
  using (true);

drop policy if exists guest_comments_insert_all on public.guest_comments;
create policy guest_comments_insert_all
  on public.guest_comments for insert
  with check (true);

grant select, insert on public.guest_comments to anon, authenticated;
