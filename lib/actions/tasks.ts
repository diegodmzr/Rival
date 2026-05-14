"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyTaskCompleted } from "@/lib/push/dispatch";
import type { TaskPriority, TaskStatus } from "@/lib/types";

type ActionResult = { ok: boolean; error?: string };

async function getAuthed() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null };
  return { supabase, userId: user.id };
}

export interface CreateTaskInput {
  projectId: string | null;
  parentTaskId?: string | null;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedUserId?: string | null;
}

export async function createTask(
  input: CreateTaskInput,
): Promise<ActionResult & { id?: string }> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Titre requis." };
  if (title.length > 200) return { ok: false, error: "Titre trop long." };

  if (input.parentTaskId) {
    const { data: parent } = await supabase
      .from("tasks")
      .select("parent_task_id, project_id")
      .eq("id", input.parentTaskId)
      .maybeSingle();
    if (!parent) return { ok: false, error: "Tâche parente introuvable." };
    if (parent.parent_task_id) {
      return { ok: false, error: "Sous-tâches limitées à 1 niveau." };
    }
    if (parent.project_id !== input.projectId) {
      return { ok: false, error: "La sous-tâche doit être dans le même projet." };
    }
  }

  const positionQuery = supabase
    .from("tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  if (input.projectId === null) {
    positionQuery.is("project_id", null);
  } else {
    positionQuery.eq("project_id", input.projectId);
  }
  if (input.parentTaskId) {
    positionQuery.eq("parent_task_id", input.parentTaskId);
  } else {
    positionQuery.is("parent_task_id", null);
  }
  const { data: maxRow } = await positionQuery.maybeSingle();
  const position = (Number(maxRow?.position ?? -1) + 1) | 0;

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      parent_task_id: input.parentTaskId ?? null,
      title,
      description: input.description?.trim() ?? "",
      priority: input.priority ?? "normal",
      due_date: input.dueDate ?? null,
      assigned_user_id: input.assignedUserId ?? null,
      created_by: userId,
      position,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: inserted?.id };
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedUserId?: string | null;
  status?: TaskStatus;
}

export async function updateTask(
  id: string,
  patch: UpdateTaskPatch,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Titre requis." };
    if (t.length > 200) return { ok: false, error: "Titre trop long." };
    update.title = t;
  }
  if (patch.description !== undefined) update.description = patch.description.trim();
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.assignedUserId !== undefined) update.assigned_user_id = patch.assignedUserId;
  if (patch.status !== undefined) {
    update.status = patch.status;
    if (patch.status === "done") {
      update.completed_by = userId;
      update.completed_at = new Date().toISOString();
    } else {
      update.completed_by = null;
      update.completed_at = null;
    }
  }

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (patch.status === "done") {
    const { data: row } = await supabase
      .from("tasks")
      .select("title, project_id")
      .eq("id", id)
      .maybeSingle();
    if (row?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name, is_personal")
        .eq("id", row.project_id)
        .maybeSingle();
      if (project && project.is_personal === false) {
        notifyTaskCompleted({
          actorUserId: userId,
          projectName: project.name,
          taskTitle: row.title,
        });
      }
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<ActionResult> {
  return updateTask(id, { status });
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderTasks(orderedIds: string[]): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("tasks").update({ position: idx }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function linkEntryTasks(
  entryId: string,
  taskIds: string[],
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: entry } = await supabase
    .from("time_entries")
    .select("project_id, user_id")
    .eq("id", entryId)
    .maybeSingle();
  if (!entry || entry.user_id !== userId) {
    return { ok: false, error: "Entrée introuvable." };
  }

  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, project_id")
      .in("id", taskIds);
    const bad = (tasks ?? []).find(
      (t) => t.project_id !== null && t.project_id !== entry.project_id,
    );
    if (bad) return { ok: false, error: "Tâche hors projet." };
  }

  const { error: delErr } = await supabase
    .from("entry_tasks")
    .delete()
    .eq("entry_id", entryId);
  if (delErr) return { ok: false, error: delErr.message };

  if (taskIds.length > 0) {
    const rows = taskIds.map((task_id) => ({ entry_id: entryId, task_id }));
    const { error: insErr } = await supabase.from("entry_tasks").insert(rows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
