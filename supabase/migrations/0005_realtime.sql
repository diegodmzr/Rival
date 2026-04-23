-- =========================================================
-- Realtime: broadcast row changes to the browser so that
-- the timer and dashboards stay in sync across devices.
-- =========================================================

-- Make sure every table the UI mirrors is part of the default
-- `supabase_realtime` publication. `add table if not exists`
-- isn't supported, so we guard each statement manually.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'active_timers'
  ) then
    execute 'alter publication supabase_realtime add table public.active_timers';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'time_entries'
  ) then
    execute 'alter publication supabase_realtime add table public.time_entries';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'
  ) then
    execute 'alter publication supabase_realtime add table public.projects';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'users'
  ) then
    execute 'alter publication supabase_realtime add table public.users';
  end if;
end
$$;
