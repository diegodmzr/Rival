-- =========================================================
-- Shared tasks: tasks both rivals must validate independently.
-- A task with is_shared = true is considered done only when
-- every user listed in completed_user_ids has checked it off.
-- =========================================================

alter table public.tasks
  add column if not exists is_shared boolean not null default false;

alter table public.tasks
  add column if not exists completed_user_ids uuid[] not null default '{}';

create index if not exists tasks_shared_idx
  on public.tasks(is_shared) where is_shared = true;
