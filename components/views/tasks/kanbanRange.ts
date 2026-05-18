import { todayISO, toISODate } from "@/lib/date";
import type { Task } from "@/lib/types";

export type KanbanRangePreset = "today" | "tomorrow" | "week" | "month" | "custom";

export interface KanbanRange {
  preset: KanbanRangePreset;
  start: string;
  end: string;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function defaultRange(): KanbanRange {
  const today = todayISO();
  return { preset: "week", start: today, end: addDays(today, 6) };
}

export function resolveRange(preset: KanbanRangePreset, current?: KanbanRange): KanbanRange {
  const today = todayISO();
  if (preset === "today") return { preset, start: today, end: today };
  if (preset === "tomorrow") {
    const t = addDays(today, 1);
    return { preset, start: t, end: t };
  }
  if (preset === "week") return { preset, start: today, end: addDays(today, 6) };
  if (preset === "month") return { preset, start: today, end: addDays(today, 29) };
  // custom: keep existing dates if available
  return {
    preset,
    start: current?.start ?? today,
    end: current?.end ?? addDays(today, 6),
  };
}

export const RANGE_LABEL: Record<KanbanRangePreset, string> = {
  today: "Aujourd'hui",
  tomorrow: "Demain",
  week: "7 jours",
  month: "30 jours",
  custom: "Personnalisé",
};

/**
 * Filter tasks for the Kanban view based on the chosen range.
 *
 * - todo / in_progress columns: include tasks with a due date inside the range.
 *   Tasks without a due date are always included (unscheduled work stays visible).
 * - done column: include tasks completed inside the range (fallback to dueDate
 *   then updatedAt if completedAt is missing).
 */
export function filterTasksForKanban(tasks: Task[], range: KanbanRange): Task[] {
  const { start, end } = range;
  return tasks.filter((t) => {
    if (t.parentTaskId) return false;
    if (t.status === "done") {
      const completion = t.completedAt
        ? t.completedAt.slice(0, 10)
        : t.dueDate ?? t.updatedAt.slice(0, 10);
      return completion >= start && completion <= end;
    }
    if (!t.dueDate) return true;
    return t.dueDate >= start && t.dueDate <= end;
  });
}
