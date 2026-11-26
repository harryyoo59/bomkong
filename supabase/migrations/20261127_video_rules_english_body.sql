-- 3번 영상규칙: 체크리스트 뒤 영어 버전 칸
alter table public.video_rules_store
  add column if not exists english_body text not null default '';
