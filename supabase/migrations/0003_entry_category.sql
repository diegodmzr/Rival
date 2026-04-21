-- Add optional category tag to time entries.
alter table public.time_entries
  add column if not exists category text;

create index if not exists time_entries_category_idx
  on public.time_entries (category);
