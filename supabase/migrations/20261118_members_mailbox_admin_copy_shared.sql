-- 7번 회원현황 메모, 손님 의견함, 관리자실 글씨. 원본 영상은 건드리지 않음.

create table if not exists public.members_room_store (
  id integer primary key check (id = 1),
  notes_body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.members_room_store enable row level security;
drop policy if exists members_room_select_all on public.members_room_store;
create policy members_room_select_all on public.members_room_store for select using (true);
drop policy if exists members_room_insert_all on public.members_room_store;
create policy members_room_insert_all on public.members_room_store for insert with check (true);
drop policy if exists members_room_update_all on public.members_room_store;
create policy members_room_update_all on public.members_room_store for update using (true) with check (true);

insert into public.members_room_store (id, notes_body, updated_at)
values (1, '', now())
on conflict (id) do nothing;

create table if not exists public.mailbox_feedback (
  id text primary key,
  name text not null default '',
  message text not null,
  created_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create index if not exists mailbox_feedback_created_idx
  on public.mailbox_feedback (created_at desc);

alter table public.mailbox_feedback enable row level security;
drop policy if exists mailbox_feedback_select_all on public.mailbox_feedback;
create policy mailbox_feedback_select_all on public.mailbox_feedback for select using (true);
drop policy if exists mailbox_feedback_insert_all on public.mailbox_feedback;
create policy mailbox_feedback_insert_all on public.mailbox_feedback for insert with check (true);

create table if not exists public.admin_copy_store (
  id integer primary key check (id = 1),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_copy_store enable row level security;
drop policy if exists admin_copy_select_all on public.admin_copy_store;
create policy admin_copy_select_all on public.admin_copy_store for select using (true);
drop policy if exists admin_copy_insert_all on public.admin_copy_store;
create policy admin_copy_insert_all on public.admin_copy_store for insert with check (true);
drop policy if exists admin_copy_update_all on public.admin_copy_store;
create policy admin_copy_update_all on public.admin_copy_store for update using (true) with check (true);

insert into public.admin_copy_store (id, payload, updated_at)
values (1, '{}'::jsonb, now())
on conflict (id) do nothing;
