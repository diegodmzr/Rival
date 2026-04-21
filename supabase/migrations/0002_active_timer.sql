-- =========================================================
-- Active timer (server-side, one per user)
-- =========================================================

create table if not exists public.active_timers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz,
  elapsed_base_sec numeric not null default 0 check (elapsed_base_sec >= 0),
  updated_at timestamptz not null default now()
);

alter table public.active_timers enable row level security;

drop policy if exists active_timers_select_own on public.active_timers;
create policy active_timers_select_own on public.active_timers
  for select using (auth.uid() = user_id);

drop policy if exists active_timers_insert_own on public.active_timers;
create policy active_timers_insert_own on public.active_timers
  for insert with check (auth.uid() = user_id);

drop policy if exists active_timers_update_own on public.active_timers;
create policy active_timers_update_own on public.active_timers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists active_timers_delete_own on public.active_timers;
create policy active_timers_delete_own on public.active_timers
  for delete using (auth.uid() = user_id);
