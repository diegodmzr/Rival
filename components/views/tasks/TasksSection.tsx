"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  useStore,
  selectCurrentUser,
  selectRivalUser,
  type TasksView,
  type TasksCalendarMode,
} from "@/lib/store";
import { TasksFilters } from "./TasksFilters";
import { TasksViewSwitcher } from "./TasksViewSwitcher";
import { TasksListView } from "./TasksListView";
import { TasksKanbanView } from "./TasksKanbanView";
import { TasksCalendarView } from "./TasksCalendarView";
import { TaskDialog } from "./TaskDialog";
import { DEFAULT_FILTERS, applyTaskFilters, type TaskFilters } from "./types";
import type { Task } from "@/lib/types";

interface Props {
  scope: { projectId: string } | "global";
}

export function TasksSection({ scope }: Props) {
  const view = useStore((s) => s.tasksView);
  const setView = useStore((s) => s.setTasksView);
  const setMode = useStore((s) => s.setTasksCalendarMode);
  const allTasks = useStore((s) => s.tasks);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  // Hydrate view preference from localStorage once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem("rival.tasksView");
      if (v === "list" || v === "kanban" || v === "calendar") {
        setView(v as TasksView);
      }
      const m = window.localStorage.getItem("rival.tasksCalendarMode");
      if (m === "week" || m === "month") {
        setMode(m as TasksCalendarMode);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseTasks: Task[] = useMemo(() => {
    if (scope === "global") return allTasks;
    return allTasks.filter((t) => t.projectId === scope.projectId);
  }, [allTasks, scope]);

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const filtered = useMemo(
    () => applyTaskFilters(baseTasks, filters, me?.id ?? "", rival?.id),
    [baseTasks, filters, me?.id, rival?.id],
  );

  const [creating, setCreating] = useState(false);
  const projectId = scope === "global" ? null : scope.projectId;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="order-2 md:order-1 min-w-0">
          <TasksFilters
            value={filters}
            onChange={setFilters}
            hideProject={scope !== "global"}
            hideStatus={view === "kanban"}
          />
        </div>
        <div className="order-1 md:order-2 flex items-center justify-between md:justify-end gap-2">
          <TasksViewSwitcher value={view} onChange={setView} />
          <button
            onClick={() => setCreating(true)}
            title="Nouvelle tâche (T)"
            className="inline-flex items-center gap-1 h-7 pl-3 pr-2 rounded-full bg-text text-bg text-[11.5px] hover:opacity-90 shrink-0"
          >
            <Plus size={11} strokeWidth={1.8} /> Nouvelle
            <span className="hidden sm:inline font-mono text-[9.5px] px-[4px] py-px rounded ml-1 text-[rgba(5,5,5,0.55)] bg-[rgba(5,5,5,0.12)]">
              T
            </span>
          </button>
        </div>
      </div>

      {view === "list" && <TasksListView tasks={filtered} />}
      {view === "kanban" && <TasksKanbanView tasks={filtered} />}
      {view === "calendar" && <TasksCalendarView tasks={filtered} />}

      <TaskDialog
        open={creating}
        onClose={() => setCreating(false)}
        defaults={{ projectId }}
      />
    </div>
  );
}
