-- 운영자(사장님) 계정은 회원 통계에서 제외
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
      and lower(email) <> 'harryyoo59@gmail.com'
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
    'total', (select count(*)::int from u),
    'lastMonth', (select count(*)::int from u, bounds b where u.created_local >= b.month_start - interval '1 month' and u.created_local < b.month_start),
    'thisMonth', (select count(*)::int from u, bounds b where u.created_local >= b.month_start and u.created_local < b.month_start + interval '1 month'),
    'lastWeek', (select count(*)::int from u, bounds b where u.created_local >= b.week_start - interval '1 week' and u.created_local < b.week_start),
    'thisWeek', (select count(*)::int from u, bounds b where u.created_local >= b.week_start and u.created_local < b.week_start + interval '1 week'),
    'today', (select count(*)::int from u, bounds b where u.created_local >= b.today_start and u.created_local < b.today_start + interval '1 day')
  );
$$;

create or replace function public.parent_active_counts()
returns json
language sql
stable
security definer
set search_path = public, auth
as $$
  with eligible as (
    select id
    from auth.users
    where email is not null
      and email <> ''
      and lower(email) <> 'harryyoo59@gmail.com'
      and email not ilike '%+bomkong-probe%'
      and email not ilike '%@example.com'
      and email not ilike '%bot%@%'
      and coalesce(raw_user_meta_data->>'is_bot', '') <> 'true'
      and last_sign_in_at is not null
  ),
  acts as (
    select
      s.user_id,
      (coalesce(s.updated_at, s.created_at) at time zone 'Australia/Sydney') as active_local
    from auth.sessions s
    inner join eligible e on e.id = s.user_id
  ),
  bounds as (
    select
      date_trunc('day', now() at time zone 'Australia/Sydney') as today_start,
      date_trunc('week', now() at time zone 'Australia/Sydney') as week_start,
      date_trunc('month', now() at time zone 'Australia/Sydney') as month_start
  )
  select json_build_object(
    'lastMonth', (select count(distinct a.user_id)::int from acts a, bounds b where a.active_local >= b.month_start - interval '1 month' and a.active_local < b.month_start),
    'thisMonth', (select count(distinct a.user_id)::int from acts a, bounds b where a.active_local >= b.month_start and a.active_local < b.month_start + interval '1 month'),
    'lastWeek', (select count(distinct a.user_id)::int from acts a, bounds b where a.active_local >= b.week_start - interval '1 week' and a.active_local < b.week_start),
    'thisWeek', (select count(distinct a.user_id)::int from acts a, bounds b where a.active_local >= b.week_start and a.active_local < b.week_start + interval '1 week'),
    'today', (select count(distinct a.user_id)::int from acts a, bounds b where a.active_local >= b.today_start and a.active_local < b.today_start + interval '1 day')
  );
$$;
