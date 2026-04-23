import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { parseISODate } from "@/lib/date";

type Client = SupabaseClient<Database>;

export interface RestDayCheck {
  active: boolean; // true when the given date is this user's rest day
  max: number;
  logged: number;
  remaining: number; // max - logged, floored at 0
}

// Returns the rest-day state for this user for a given date, plus
// how many hours are already logged that day.
export async function getRestDayCheck(
  supabase: Client,
  userId: string,
  dateISO: string,
): Promise<RestDayCheck> {
  const { data: me } = await supabase
    .from("users")
    .select("rest_day_weekday, rest_day_max_hours")
    .eq("id", userId)
    .maybeSingle();

  const weekday = me?.rest_day_weekday;
  const active =
    weekday !== null &&
    weekday !== undefined &&
    parseISODate(dateISO).getDay() === weekday;

  const max = Number(me?.rest_day_max_hours ?? 0);

  if (!active) {
    return { active: false, max, logged: 0, remaining: Infinity };
  }

  const { data: existing } = await supabase
    .from("time_entries")
    .select("hours")
    .eq("user_id", userId)
    .eq("date", dateISO);

  const logged = (existing ?? []).reduce(
    (s, e) => s + Number(e.hours),
    0,
  );

  return {
    active,
    max,
    logged,
    remaining: Math.max(0, max - logged),
  };
}
