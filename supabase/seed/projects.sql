-- Seed initial projects.
-- PREREQ: at least one row exists in public.users (connect once via magic link first).
-- The projects will be attributed to the OLDEST user (the first one to log in).
-- Safe to re-run: guards against duplicates by name.

insert into public.projects (name, created_by)
select p.name, u.id
from (values
  ('My Folio — Core'),
  ('My Folio — Marketing'),
  ('My Folio — Ops'),
  ('My Folio — Client A'),
  ('My Folio — Perso')
) as p(name)
cross join lateral (
  select id from public.users order by created_at asc limit 1
) as u
where not exists (
  select 1 from public.projects existing where existing.name = p.name
);
