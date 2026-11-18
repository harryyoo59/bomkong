-- 3번 영상제작 규칙 (관리자용·AI용). 원본 영상·사진 테이블은 건드리지 않음.
create table if not exists public.video_rules_store (
  id integer primary key check (id = 1),
  admin_body text not null default '',
  ai_body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.video_rules_store enable row level security;

drop policy if exists video_rules_select_all on public.video_rules_store;
create policy video_rules_select_all
  on public.video_rules_store for select using (true);

drop policy if exists video_rules_insert_all on public.video_rules_store;
create policy video_rules_insert_all
  on public.video_rules_store for insert with check (true);

drop policy if exists video_rules_update_all on public.video_rules_store;
create policy video_rules_update_all
  on public.video_rules_store for update using (true) with check (true);

insert into public.video_rules_store (id, admin_body, ai_body, updated_at)
values (1, '', '', now())
on conflict (id) do nothing;
