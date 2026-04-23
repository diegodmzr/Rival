-- =========================================================
-- Rest day: one day a week each user caps their own work at
-- a max number of hours, to force a pause against burnout.
-- The cap can't be raised once you're on the rest day itself.
-- =========================================================

alter table public.users
  add column if not exists rest_day_weekday smallint
    check (rest_day_weekday is null or (rest_day_weekday between 0 and 6));

alter table public.users
  add column if not exists rest_day_max_hours numeric(5, 2) not null default 0
    check (rest_day_max_hours >= 0);
