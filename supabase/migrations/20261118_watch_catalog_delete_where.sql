-- safeupdate: DELETE must include a WHERE clause
create or replace function public.replace_watch_catalog(p_items jsonb, p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
  elem jsonb;
  out_items jsonb := '[]'::jsonb;
  ep int;
begin
  select write_secret into expected from public.watch_write_guard where id = 1;
  if expected is null or p_secret is distinct from expected then
    raise exception 'forbidden';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_items';
  end if;

  delete from public.watch_items where true;

  for elem in select * from jsonb_array_elements(p_items)
  loop
    ep := coalesce((elem->>'episodeNumber')::int, (elem->>'episode_number')::int, 0);
    if ep < 0 then
      ep := 0;
    end if;
    insert into public.watch_items (
      id, name, title, youtube_url, note, added_at, episode_number, lang, updated_at
    ) values (
      coalesce(elem->>'id', gen_random_uuid()::text),
      coalesce(elem->>'name', ''),
      coalesce(elem->>'title', ''),
      coalesce(elem->>'youtubeUrl', elem->>'youtube_url', ''),
      coalesce(elem->>'note', ''),
      coalesce((elem->>'addedAt')::timestamptz, (elem->>'added_at')::timestamptz, now()),
      ep,
      case when elem->>'lang' = 'en' then 'en' else 'ko' end,
      now()
    );
  end loop;

  select coalesce(jsonb_agg(to_jsonb(w) order by w.episode_number, w.lang), '[]'::jsonb)
    into out_items
  from public.watch_items w;

  return out_items;
end;
$$;

revoke all on function public.replace_watch_catalog(jsonb, text) from public;
grant execute on function public.replace_watch_catalog(jsonb, text) to anon, authenticated;
