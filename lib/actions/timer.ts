"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type TimerRow = Database["public"]["Tables"]["active_timers"]["Row"];

type ActionResult = { ok: boolean; error?: string };

async function getAuthed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null };
  return { supabase, userId: user.id };
}

export async function startTimer(projectId?: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: existing } = await supabase
    .from("active_timers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<TimerRow>();

  const nextProjectId = projectId ?? existing?.project_id ?? null;
  const elapsed = existing ? Number(existing.elapsed_base_sec) : 0;
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("active_timers").upsert({
    user_id: userId,
    project_id: nextProjectId,
    started_at: nowIso,
    elapsed_base_sec: elapsed,
    updated_at: nowIso,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function pauseTimer(): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: row } = await supabase
    .from("active_timers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<TimerRow>();
  if (!row || !row.started_at) return { ok: true };

  const delta = Math.max(
    0,
    (Date.now() - new Date(row.started_at).getTime()) / 1000,
  );
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("active_timers")
    .update({
      started_at: null,
      elapsed_base_sec: Number(row.elapsed_base_sec) + delta,
      updated_at: nowIso,
    })
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setTimerProject(projectId: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const nowIso = new Date().toISOString();
  const nextProjectId = projectId || null;

  const { data: existing } = await supabase
    .from("active_timers")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("active_timers")
      .update({ project_id: nextProjectId, updated_at: nowIso })
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("active_timers").insert({
      user_id: userId,
      project_id: nextProjectId,
      started_at: null,
      elapsed_base_sec: 0,
    });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function resetTimer(): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase
    .from("active_timers")
    .delete()
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface StopTimerResult extends ActionResult {
  savedHours?: number;
}

export async function stopTimerAndSave(
  dateISO: string,
  note?: string,
): Promise<StopTimerResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: row } = await supabase
    .from("active_timers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<TimerRow>();
  if (!row) return { ok: true, savedHours: 0 };

  const elapsedBase = Number(row.elapsed_base_sec);
  const runningDelta = row.started_at
    ? Math.max(0, (Date.now() - new Date(row.started_at).getTime()) / 1000)
    : 0;
  const totalSec = elapsedBase + runningDelta;
  const hours = Math.round((totalSec / 3600) * 4) / 4;

  if (hours > 0 && row.project_id) {
    const { error: insErr } = await supabase.from("time_entries").insert({
      user_id: userId,
      project_id: row.project_id,
      hours,
      date: dateISO,
      note: note?.trim() ?? "",
    });
    if (insErr) return { ok: false, error: insErr.message };
  }

  const { error: delErr } = await supabase
    .from("active_timers")
    .delete()
    .eq("user_id", userId);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath("/", "layout");
  return { ok: true, savedHours: hours };
}
