-- =========================================================
-- Tasks: task management per project (or free / off-project),
-- with optional links to time entries. Tasks on shared
-- (non-personal) projects are visible & editable by both
-- rivals; tasks on personal projects or free tasks are
-- private to their creator. Subtasks supported via
-- parent_task_id (max depth 1 enforced at application level).
-- =========================================================

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  due_date date,
  assigned_user_id uuid references public.users(id) on delete set null,
  created_by uuid not null references public.users(id) on delete cascade,
  completed_by uuid references public.users(id) on delete set null,
  completed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists tasks_parent_idx on public.tasks(parent_task_id);
create index if not exists tasks_assigned_idx on public.tasks(assigned_user_id);
create index if not exists tasks_created_by_idx on public.tasks(created_by);
create index if not exists tasks_due_open_idx
  on public.tasks(due_date) where status <> 'done';

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Liaison N-N entre une session (time_entry) et des tâches.
create table if not exists public.entry_tasks (
  entry_id uuid not null references public.time_entries(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, task_id)
);

create index if not exists entry_tasks_task_idx on public.entry_tasks(task_id);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.entry_tasks enable row level security;

-- Helper: visible si tâche libre du créateur, OU tâche sur projet
-- personnel du créateur, OU tâche sur projet partagé non-personnel.
drop policy if exists tasks_select_visible on public.tasks;
create policy tasks_select_visible on public.tasks
  for select using (
    auth.role() = 'authenticated'
    and (
      (project_id is null and created_by = auth.uid())
      or exists (
        select 1 from public.projects p
        where p.id = tasks.project_id
          and (p.is_personal = false or p.created_by = auth.uid())
      )
    )
  );

drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks
  for insert with check (
    created_by = auth.uid()
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = tasks.project_id
          and (p.is_personal = false or p.created_by = auth.uid())
      )
    )
  );

drop policy if exists tasks_update_visible on public.tasks;
create policy tasks_update_visible on public.tasks
  for update using (
    auth.role() = 'authenticated'
    and (
      (project_id is null and created_by = auth.uid())
      or exists (
        select 1 from public.projects p
        where p.id = tasks.project_id
          and (p.is_personal = false or p.created_by = auth.uid())
      )
    )
  );

drop policy if exists tasks_delete_visible on public.tasks;
create policy tasks_delete_visible on public.tasks
  for delete using (
    auth.role() = 'authenticated'
    and (
      (project_id is null and created_by = auth.uid())
      or exists (
        select 1 from public.projects p
        where p.id = tasks.project_id
          and (p.is_personal = false or p.created_by = auth.uid())
      )
    )
  );

-- entry_tasks: l'utilisateur doit posséder l'entry sous-jacent.
drop policy if exists entry_tasks_select_own on public.entry_tasks;
create policy entry_tasks_select_own on public.entry_tasks
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.time_entries e
      where e.id = entry_tasks.entry_id and e.user_id = auth.uid()
    )
  );

drop policy if exists entry_tasks_insert_own on public.entry_tasks;
create policy entry_tasks_insert_own on public.entry_tasks
  for insert with check (
    exists (
      select 1 from public.time_entries e
      where e.id = entry_tasks.entry_id and e.user_id = auth.uid()
    )
  );

drop policy if exists entry_tasks_delete_own on public.entry_tasks;
create policy entry_tasks_delete_own on public.entry_tasks
  for delete using (
    exists (
      select 1 from public.time_entries e
      where e.id = entry_tasks.entry_id and e.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- Realtime: same guarded pattern as 0005.
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.tasks';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'entry_tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.entry_tasks';
  end if;
end $$;
