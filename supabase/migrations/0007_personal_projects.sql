-- =========================================================
-- Personal projects: each user gets a private "Personnel"
-- bucket for learning / formation time. The bucket counts
-- toward totals and goals but is hidden from the other user
-- and from the shared project breakdown.
-- =========================================================

alter table public.projects
  add column if not exists is_personal boolean not null default false;

create index if not exists projects_is_personal_idx on public.projects(is_personal);

-- Only one personal project per user.
create unique index if not exists projects_one_personal_per_user
  on public.projects(created_by)
  where is_personal;

-- Tighten the select policy so personal projects are only
-- visible to their owner.
drop policy if exists projects_select_all on public.projects;
drop policy if exists projects_select_visible on public.projects;
create policy projects_select_visible on public.projects
  for select using (
    auth.role() = 'authenticated'
    and (is_personal = false or created_by = auth.uid())
  );

-- Extend the new-user trigger so every freshly created profile
-- comes with a personal project. Keep the previous profile
-- insert behaviour verbatim.
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

  insert into public.projects (name, created_by, is_personal)
  values ('Personnel', new.id, true)
  on conflict do nothing;

  return new;
end;
$$;

-- Backfill: make sure every existing user has a personal project.
insert into public.projects (name, created_by, is_personal)
select 'Personnel', u.id, true
from public.users u
where not exists (
  select 1 from public.projects p
  where p.created_by = u.id and p.is_personal
);
