-- =========================================================
-- Task recurrence: a mother task carries a JSON rule, and
-- generated occurrences point back to it via
-- recurrence_parent_id. Each occurrence is an independent
-- row that can be edited/completed individually.
-- =========================================================

alter table public.tasks
  add column if not exists recurrence jsonb,
  add column if not exists recurrence_parent_id uuid
    references public.tasks(id) on delete cascade;

create index if not exists tasks_recurrence_parent_idx
  on public.tasks(recurrence_parent_id);
