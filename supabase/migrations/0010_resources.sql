-- =========================================================
-- Resources: a shared library between rivals. Documents
-- (PDF links) and YouTube videos. Each user can mark a
-- resource as watched or to re-watch — visible to the other.
-- =========================================================

create table if not exists public.resources (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('youtube', 'pdf')),
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  category text not null default '',
  url text not null,
  youtube_id text,
  thumbnail_url text,
  added_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists resources_created_at_idx on public.resources(created_at desc);
create index if not exists resources_kind_idx on public.resources(kind);
create index if not exists resources_category_idx on public.resources(category);

-- Per-user view status. No row = "à voir".
create table if not exists public.resource_views (
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('watched', 'rewatch')),
  updated_at timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create index if not exists resource_views_user_id_idx on public.resource_views(user_id);

drop trigger if exists resource_views_set_updated_at on public.resource_views;
create trigger resource_views_set_updated_at
  before update on public.resource_views
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.resources enable row level security;
alter table public.resource_views enable row level security;

drop policy if exists resources_select_all on public.resources;
create policy resources_select_all on public.resources
  for select using (auth.role() = 'authenticated');

drop policy if exists resources_insert_own on public.resources;
create policy resources_insert_own on public.resources
  for insert with check (auth.uid() = added_by);

drop policy if exists resources_update_own on public.resources;
create policy resources_update_own on public.resources
  for update using (auth.uid() = added_by) with check (auth.uid() = added_by);

drop policy if exists resources_delete_own on public.resources;
create policy resources_delete_own on public.resources
  for delete using (auth.uid() = added_by);

drop policy if exists resource_views_select_all on public.resource_views;
create policy resource_views_select_all on public.resource_views
  for select using (auth.role() = 'authenticated');

drop policy if exists resource_views_insert_own on public.resource_views;
create policy resource_views_insert_own on public.resource_views
  for insert with check (auth.uid() = user_id);

drop policy if exists resource_views_update_own on public.resource_views;
create policy resource_views_update_own on public.resource_views
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists resource_views_delete_own on public.resource_views;
create policy resource_views_delete_own on public.resource_views
  for delete using (auth.uid() = user_id);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resources'
  ) then
    execute 'alter publication supabase_realtime add table public.resources';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'resource_views'
  ) then
    execute 'alter publication supabase_realtime add table public.resource_views';
  end if;
end
$$;
