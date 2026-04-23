"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { notifyEntryAdded, notifyDailyMilestone } from "@/lib/push/dispatch";
import { todayISO } from "@/lib/date";
import { getRestDayCheck } from "@/lib/restDay";
import { fmt } from "@/lib/format";

type EntryUpdate = Database["public"]["Tables"]["time_entries"]["Update"];

export interface AddEntryInput {
  projectId: string;
  hours: number;
  date: string;
  note?: string;
  category?: string | null;
}

export async function addEntry(input: AddEntryInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  // Rest-day check: block the insert if it would push the day over the cap.
  const rest = await getRestDayCheck(supabase, user.id, input.date);
  if (rest.active && rest.logged + input.hours > rest.max) {
    return {
      ok: false,
      error: `Jour de repos — max ${fmt(rest.max)} aujourd'hui. Déjà ${fmt(rest.logged)} loggées.`,
    };
  }

  // Day total before insert — used to detect milestone crossings.
  let beforeHours = rest.active ? rest.logged : 0;
  if (!rest.active && input.date === todayISO()) {
    const { data: existing } = await supabase
      .from("time_entries")
      .select("hours")
      .eq("user_id", user.id)
      .eq("date", input.date);
    beforeHours = (existing ?? []).reduce(
      (s, e) => s + Number(e.hours),
      0,
    );
  }

  const { error } = await supabase.from("time_entries").insert({
    user_id: user.id,
    project_id: input.projectId,
    hours: input.hours,
    date: input.date,
    note: input.note?.trim() ?? "",
    category: input.category?.trim() ? input.category.trim() : null,
  });
  if (error) return { ok: false, error: error.message };

  const { data: proj } = await supabase
    .from("projects")
    .select("name, is_personal")
    .eq("id", input.projectId)
    .maybeSingle();
  // Personal entries stay silent — notifying the rival of your own
  // learning time is noise.
  if (proj && !proj.is_personal) {
    notifyEntryAdded({
      actorUserId: user.id,
      projectName: proj.name,
      hours: input.hours,
      date: input.date,
    });
  }

  if (input.date === todayISO()) {
    notifyDailyMilestone({
      userId: user.id,
      oldHours: beforeHours,
      newHours: beforeHours + input.hours,
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export interface UpdateEntryInput {
  hours?: number;
  date?: string;
  note?: string;
  projectId?: string;
  category?: string | null;
}

export async function updateEntry(
  id: string,
  patch: UpdateEntryInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const dbPatch: EntryUpdate = {};
  if (patch.hours !== undefined) dbPatch.hours = patch.hours;
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.note !== undefined) dbPatch.note = patch.note.trim();
  if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId;
  if (patch.category !== undefined) {
    dbPatch.category = patch.category?.trim() ? patch.category.trim() : null;
  }

  const { error } = await supabase.from("time_entries").update(dbPatch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEntry(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
