-- 3번 영상규칙: 체크리스트 옆 쿠키영상 칸
alter table public.video_rules_store
  add column if not exists cookie_body text not null default '';
