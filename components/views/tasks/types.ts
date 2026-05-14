import type { Task, TaskPriority, TaskStatus, UserId } from "@/lib/types";

export type TaskFilters = {
  projectId: "all" | "free" | string;
  priority: "all" | TaskPriority;
  assignment: "all" | "me" | "rival" | "common";
  status: "all" | TaskStatus;
  search: string;
};

export const DEFAULT_FILTERS: TaskFilters = {
  projectId: "all",
  priority: "all",
  assignment: "all",
  status: "all",
  search: "",
};

export function applyTaskFilters(
  tasks: Task[],
  filters: TaskFilters,
  meId: UserId,
  rivalId: UserId | undefined,
): Task[] {
  return tasks.filter((t) => {
    if (filters.projectId === "free" && t.projectId !== null) return false;
    if (
      filters.projectId !== "all" &&
      filters.projectId !== "free" &&
      t.projectId !== filters.projectId
    )
      return false;
    if (filters.priority !== "all" && t.priority !== filters.priority) return false;
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.assignment === "me" && t.assignedUserId !== meId) return false;
    if (filters.assignment === "rival" && t.assignedUserId !== rivalId) return false;
    if (filters.assignment === "common" && t.assignedUserId !== null) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}
