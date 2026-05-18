"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyTaskCompleted } from "@/lib/push/dispatch";
import type { Database } from "@/lib/supabase/database.types";
import type { RecurrenceRule, TaskPriority, TaskStatus } from "@/lib/types";
import {
  generateOccurrenceDates,
  MAX_GENERATED_OCCURRENCES,
  validateRecurrence,
} from "@/lib/recurrence";

type TaskUpdateRow = Database["public"]["Tables"]["tasks"]["Update"];

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
  isShared?: boolean;
  recurrence?: RecurrenceRule | null;
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

  const recurrence = input.recurrence ?? null;
  if (recurrence) {
    if (input.parentTaskId) {
      return { ok: false, error: "Une sous-tâche ne peut pas être récurrente." };
    }
    if (!input.dueDate) {
      return { ok: false, error: "Date de début requise pour une récurrence." };
    }
    const ruleErr = validateRecurrence(recurrence);
    if (ruleErr) return { ok: false, error: ruleErr };
  }

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      parent_task_id: input.parentTaskId ?? null,
      title,
      description: input.description?.trim() ?? "",
      priority: input.priority ?? "normal",
      due_date: input.dueDate ?? null,
      assigned_user_id: input.isShared ? null : input.assignedUserId ?? null,
      is_shared: input.isShared ?? false,
      completed_user_ids: [],
      recurrence: recurrence ?? null,
      created_by: userId,
      position,
    })
    .select("id, due_date")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  // Generate further occurrences from the mother task.
  if (recurrence && inserted?.id && inserted.due_date) {
    const allDates = generateOccurrenceDates(recurrence, inserted.due_date);
    const futureDates = allDates.slice(1, MAX_GENERATED_OCCURRENCES);
    if (futureDates.length > 0) {
      const rows = futureDates.map((d, idx) => ({
        project_id: input.projectId,
        parent_task_id: null,
        title,
        description: input.description?.trim() ?? "",
        priority: input.priority ?? "normal",
        due_date: d,
        assigned_user_id: input.isShared ? null : input.assignedUserId ?? null,
        is_shared: input.isShared ?? false,
        completed_user_ids: [],
        recurrence_parent_id: inserted.id,
        created_by: userId,
        position: position + idx + 1,
      }));
      const { error: genErr } = await supabase.from("tasks").insert(rows);
      if (genErr) return { ok: false, error: genErr.message };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, id: inserted?.id };
}

export async function deleteTaskSeries(
  motherId: string,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  // Delete all occurrences referencing the mother first (FK has cascade,
  // but doing it explicitly keeps RLS checks consistent).
  const { error: childErr } = await supabase
    .from("tasks")
    .delete()
    .eq("recurrence_parent_id", motherId);
  if (childErr) return { ok: false, error: childErr.message };

  const { error } = await supabase.from("tasks").delete().eq("id", motherId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedUserId?: string | null;
  status?: TaskStatus;
  isShared?: boolean;
}

export async function updateTask(
  id: string,
  patch: UpdateTaskPatch,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const update: TaskUpdateRow = {};
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
  if (patch.isShared !== undefined) {
    update.is_shared = patch.isShared;
    if (patch.isShared) {
      update.assigned_user_id = null;
      update.completed_user_ids = [];
      update.status = "todo";
      update.completed_by = null;
      update.completed_at = null;
    } else {
      update.completed_user_ids = [];
    }
  }
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

export async function toggleSharedTaskForMe(
  id: string,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: task } = await supabase
    .from("tasks")
    .select("is_shared, completed_user_ids, title, project_id")
    .eq("id", id)
    .maybeSingle();
  if (!task) return { ok: false, error: "Tâche introuvable." };
  if (!task.is_shared) return { ok: false, error: "Tâche non partagée." };

  const current = task.completed_user_ids ?? [];
  const has = current.includes(userId);
  const next = has ? current.filter((u) => u !== userId) : [...current, userId];

  const { data: users } = await supabase.from("users").select("id");
  const totalUsers = users?.length ?? 0;
  const allDone = totalUsers > 0 && next.length >= totalUsers;

  const update: TaskUpdateRow = {
    completed_user_ids: next,
    status: allDone ? "done" : next.length > 0 ? "in_progress" : "todo",
    completed_by: allDone ? userId : null,
    completed_at: allDone ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (allDone && task.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("name, is_personal")
      .eq("id", task.project_id)
      .maybeSingle();
    if (project && project.is_personal === false) {
      notifyTaskCompleted({
        actorUserId: userId,
        projectName: project.name,
        taskTitle: task.title,
      });
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
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

// ---------------------------------------------------------
// Attachments
// ---------------------------------------------------------

export interface AddTaskFileInput {
  taskId: string;
  name: string;
  storagePath: string;
  url: string;
  sizeBytes: number;
  mime: string | null;
}

export async function addTaskFile(
  input: AddTaskFileInput,
): Promise<ActionResult & { id?: string }> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nom requis." };

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: input.taskId,
      kind: "file",
      name: name.slice(0, 200),
      url: input.url,
      storage_path: input.storagePath,
      size_bytes: input.sizeBytes,
      mime: input.mime,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: data?.id };
}

export interface AddTaskLinkInput {
  taskId: string;
  name: string;
  url: string;
}

export async function addTaskLink(
  input: AddTaskLinkInput,
): Promise<ActionResult & { id?: string }> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const name = input.name.trim();
  const url = input.url.trim();
  if (!url) return { ok: false, error: "URL requise." };
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "URL invalide." };
    }
  } catch {
    return { ok: false, error: "URL invalide." };
  }

  const { data, error } = await supabase
    .from("task_attachments")
    .insert({
      task_id: input.taskId,
      kind: "link",
      name: (name || url).slice(0, 200),
      url,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, id: data?.id };
}

export async function removeTaskAttachment(
  id: string,
): Promise<ActionResult> {
  const { supabase, userId } = await getAuthed();
  if (!userId) return { ok: false, error: "Non authentifié." };

  const { data: row } = await supabase
    .from("task_attachments")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("task_attachments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (row?.storage_path) {
    await supabase.storage.from("task-attachments").remove([row.storage_path]);
  }

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
