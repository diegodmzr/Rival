-- =========================================================
-- Resource files: public Supabase Storage bucket so PDFs can
-- be uploaded directly instead of pasting an external URL.
-- =========================================================

alter table public.resources
  add column if not exists storage_path text;

-- Bucket. Public so the served URL works without a session
-- (paths are UUIDs so they remain practically unguessable).
insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', true)
on conflict (id) do update set public = true;

-- Storage policies: any authenticated user can upload/replace/delete,
-- and reads go through the public CDN URL.
drop policy if exists resource_files_insert on storage.objects;
create policy resource_files_insert on storage.objects
  for insert
  with check (bucket_id = 'resource-files' and auth.role() = 'authenticated');

drop policy if exists resource_files_update on storage.objects;
create policy resource_files_update on storage.objects
  for update
  using (bucket_id = 'resource-files' and auth.role() = 'authenticated')
  with check (bucket_id = 'resource-files' and auth.role() = 'authenticated');

drop policy if exists resource_files_delete on storage.objects;
create policy resource_files_delete on storage.objects
  for delete
  using (bucket_id = 'resource-files' and auth.role() = 'authenticated');

drop policy if exists resource_files_select on storage.objects;
create policy resource_files_select on storage.objects
  for select
  using (bucket_id = 'resource-files');
