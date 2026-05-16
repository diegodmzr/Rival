-- =========================================================
-- Task attachments: files (stored in Supabase Storage) and
-- external links attached to a task. Visibility follows the
-- same rules as the parent task (see 0012_tasks.sql).
-- =========================================================

create table if not exists public.task_attachments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  kind text not null check (kind in ('file', 'link')),
  name text not null check (char_length(trim(name)) between 1 and 200),
  url text not null,
  storage_path text,
  size_bytes bigint,
  mime text,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists task_attachments_task_idx
  on public.task_attachments(task_id);

-- ---------------------------------------------------------
-- RLS: an attachment is visible iff its parent task is
-- visible to the current user (delegates to tasks RLS).
-- ---------------------------------------------------------
alter table public.task_attachments enable row level security;

drop policy if exists task_attachments_select_visible on public.task_attachments;
create policy task_attachments_select_visible on public.task_attachments
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.tasks t where t.id = task_attachments.task_id
    )
  );

drop policy if exists task_attachments_insert_own on public.task_attachments;
create policy task_attachments_insert_own on public.task_attachments
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.tasks t where t.id = task_attachments.task_id
    )
  );

drop policy if exists task_attachments_delete_visible on public.task_attachments;
create policy task_attachments_delete_visible on public.task_attachments
  for delete using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.tasks t where t.id = task_attachments.task_id
    )
  );

-- ---------------------------------------------------------
-- Storage bucket. Public + UUID paths, same pattern as
-- 0011_resource_files.sql. Path layout: <task_id>/<uuid>-<name>.
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do update set public = true;

drop policy if exists task_attachments_files_insert on storage.objects;
create policy task_attachments_files_insert on storage.objects
  for insert
  with check (bucket_id = 'task-attachments' and auth.role() = 'authenticated');

drop policy if exists task_attachments_files_update on storage.objects;
create policy task_attachments_files_update on storage.objects
  for update
  using (bucket_id = 'task-attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'task-attachments' and auth.role() = 'authenticated');

drop policy if exists task_attachments_files_delete on storage.objects;
create policy task_attachments_files_delete on storage.objects
  for delete
  using (bucket_id = 'task-attachments' and auth.role() = 'authenticated');

drop policy if exists task_attachments_files_select on storage.objects;
create policy task_attachments_files_select on storage.objects
  for select
  using (bucket_id = 'task-attachments');

-- ---------------------------------------------------------
-- Realtime.
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_attachments'
  ) then
    execute 'alter publication supabase_realtime add table public.task_attachments';
  end if;
end $$;
