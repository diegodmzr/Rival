"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addProject(name: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nom requis." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ name: trimmed, created_by: user.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function renameProject(
  id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nom requis." };

  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ name: trimmed }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();

  const { count, error: countErr } = await supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true })
    .eq("project_id", id);
  if (countErr) return { ok: false, error: countErr.message };
  if ((count ?? 0) > 0) {
    return { ok: false, error: "Ce projet a des entrées associées." };
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
