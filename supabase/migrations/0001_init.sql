-- =========================================================
-- Diego × Ismaël — Productivity Tracker
-- Initial schema: users, projects, time_entries + RLS + trigger
-- =========================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- public.users (profile extending auth.users)
-- ---------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  initials text not null check (char_length(initials) between 1 and 3),
  weekly_goal_hours numeric not null default 40 check (weekly_goal_hours >= 0),
  monthly_goal_hours numeric not null default 160 check (monthly_goal_hours >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- public.projects (shared by the team)
-- ---------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.users(id) on delete restrict
);

-- ---------------------------------------------------------
-- public.time_entries (each user owns their own)
-- ---------------------------------------------------------
create table if not exists public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete restrict,
  hours numeric not null check (hours > 0),
  date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists time_entries_user_id_idx on public.time_entries(user_id);
create index if not exists time_entries_project_id_idx on public.time_entries(project_id);
create index if not exists time_entries_date_idx on public.time_entries(date desc);
create index if not exists time_entries_created_at_idx on public.time_entries(created_at desc);

-- ---------------------------------------------------------
-- Trigger: auto-create public.users row when auth.users is created
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  default_initials text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  default_initials := upper(
    substring(regexp_replace(display_name, '[^A-Za-z]', '', 'g') from 1 for 2)
  );
  if default_initials is null or default_initials = '' then
    default_initials := upper(substring(new.email from 1 for 2));
  end if;

  insert into public.users (id, email, name, initials)
  values (new.id, new.email, display_name, default_initials)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------
alter table public.users         enable row level security;
alter table public.projects      enable row level security;
alter table public.time_entries  enable row level security;

-- users: any authenticated member sees all profiles, edits only own
drop policy if exists users_select_all on public.users;
create policy users_select_all on public.users
  for select using (auth.role() = 'authenticated');

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- projects: fully shared read/write among authenticated members
drop policy if exists projects_select_all on public.projects;
create policy projects_select_all on public.projects
  for select using (auth.role() = 'authenticated');

drop policy if exists projects_insert_any on public.projects;
create policy projects_insert_any on public.projects
  for insert with check (auth.uid() = created_by);

drop policy if exists projects_update_any on public.projects;
create policy projects_update_any on public.projects
  for update using (auth.role() = 'authenticated');

drop policy if exists projects_delete_any on public.projects;
create policy projects_delete_any on public.projects
  for delete using (auth.role() = 'authenticated');

-- time_entries: everyone sees everyone (rivalry), only owner writes
drop policy if exists entries_select_all on public.time_entries;
create policy entries_select_all on public.time_entries
  for select using (auth.role() = 'authenticated');

drop policy if exists entries_insert_own on public.time_entries;
create policy entries_insert_own on public.time_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists entries_update_own on public.time_entries;
create policy entries_update_own on public.time_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists entries_delete_own on public.time_entries;
create policy entries_delete_own on public.time_entries
  for delete using (auth.uid() = user_id);
