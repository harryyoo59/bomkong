-- 3번 영상규칙: AI 옆 체크리스트 칸
alter table public.video_rules_store
  add column if not exists checklist_body text not null default '';
