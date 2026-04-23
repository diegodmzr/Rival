-- =========================================================
-- Day recaps: a free-form paragraph per user per day, so
-- each rival can share what they worked on.
-- =========================================================

create table if not exists public.day_recaps (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists day_recaps_date_idx on public.day_recaps(date desc);
create index if not exists day_recaps_user_id_idx on public.day_recaps(user_id);

-- Keep updated_at fresh on every row update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists day_recaps_set_updated_at on public.day_recaps;
create trigger day_recaps_set_updated_at
  before update on public.day_recaps
  for each row execute function public.touch_updated_at();

-- Row-level security: everyone reads, only owner writes.
alter table public.day_recaps enable row level security;

drop policy if exists day_recaps_select_all on public.day_recaps;
create policy day_recaps_select_all on public.day_recaps
  for select using (auth.role() = 'authenticated');

drop policy if exists day_recaps_insert_own on public.day_recaps;
create policy day_recaps_insert_own on public.day_recaps
  for insert with check (auth.uid() = user_id);

drop policy if exists day_recaps_update_own on public.day_recaps;
create policy day_recaps_update_own on public.day_recaps
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists day_recaps_delete_own on public.day_recaps;
create policy day_recaps_delete_own on public.day_recaps
  for delete using (auth.uid() = user_id);

-- Make day_recaps part of the realtime publication so edits sync live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'day_recaps'
  ) then
    execute 'alter publication supabase_realtime add table public.day_recaps';
  end if;
end
$$;
