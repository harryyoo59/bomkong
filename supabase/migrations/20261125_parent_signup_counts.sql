-- 회원현황: 부모 가입 인원(전월/금월/전주/금주/오늘) — 시드니 시간 기준
create or replace function public.parent_signup_counts()
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  with u as (
    select (created_at at time zone 'Australia/Sydney') as created_local
    from auth.users
    where email is not null
      and email <> ''
      and email not ilike '%+bomkong-probe%'
      and email not ilike '%@example.com'
      and email not ilike '%bot%@%'
      and coalesce(raw_user_meta_data->>'is_bot', '') <> 'true'
  ),
  bounds as (
    select
      date_trunc('day', now() at time zone 'Australia/Sydney') as today_start,
      date_trunc('week', now() at time zone 'Australia/Sydney') as week_start,
      date_trunc('month', now() at time zone 'Australia/Sydney') as month_start
  )
  select json_build_object(
    'lastMonth', (select count(*)::int from u, bounds b where u.created_local >= b.month_start - interval '1 month' and u.created_local < b.month_start),
    'thisMonth', (select count(*)::int from u, bounds b where u.created_local >= b.month_start and u.created_local < b.month_start + interval '1 month'),
    'lastWeek', (select count(*)::int from u, bounds b where u.created_local >= b.week_start - interval '1 week' and u.created_local < b.week_start),
    'thisWeek', (select count(*)::int from u, bounds b where u.created_local >= b.week_start and u.created_local < b.week_start + interval '1 week'),
    'today', (select count(*)::int from u, bounds b where u.created_local >= b.today_start and u.created_local < b.today_start + interval '1 day')
  );
$$;

revoke all on function public.parent_signup_counts() from public;
grant execute on function public.parent_signup_counts() to anon, authenticated;
