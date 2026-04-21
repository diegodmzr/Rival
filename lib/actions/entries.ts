"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

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

  const { error } = await supabase.from("time_entries").insert({
    user_id: user.id,
    project_id: input.projectId,
    hours: input.hours,
    date: input.date,
    note: input.note?.trim() ?? "",
    category: input.category?.trim() ? input.category.trim() : null,
  });
  if (error) return { ok: false, error: error.message };

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
