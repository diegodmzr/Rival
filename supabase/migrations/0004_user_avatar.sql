-- =========================================================
-- Profile avatars: column + storage bucket + RLS
-- =========================================================

alter table public.users
  add column if not exists avatar_url text;

-- Public storage bucket for avatars (images are small, non-sensitive)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Anyone authenticated can read (bucket is public anyway, but explicit)
drop policy if exists "avatars_select_all" on storage.objects;
create policy "avatars_select_all" on storage.objects
  for select using (bucket_id = 'avatars');

-- A user can only write objects under a folder matching their own uid.
-- Client must upload to path: <auth.uid()>/<filename>
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
