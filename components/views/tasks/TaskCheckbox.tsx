"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { setTaskStatus, toggleSharedTaskForMe } from "@/lib/actions/tasks";
import type { Task, TaskStatus } from "@/lib/types";

const CYCLE_NEXT: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

interface Props {
  task: Task;
  /**
   * - "binary": toggle todo ↔ done
   * - "cycle": todo → in_progress → done → todo
   */
  mode?: "binary" | "cycle";
  size?: number;
}

export function TaskCheckbox({ task, mode = "binary", size = 14 }: Props) {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [pending, startTransition] = useTransition();

  const done = task.status === "done";
  const inProgress = task.status === "in_progress";
  const mineDone = task.isShared && task.completedUserIds.includes(currentUserId);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;

    if (task.isShared) {
      const set = new Set(task.completedUserIds);
      if (set.has(currentUserId)) set.delete(currentUserId);
      else set.add(currentUserId);
      const allIds = Object.keys(users);
      const allDone = allIds.length > 0 && allIds.every((id) => set.has(id));
      updateLocal(task.id, {
        completedUserIds: Array.from(set),
        status: allDone ? "done" : set.size > 0 ? "in_progress" : "todo",
        completedAt: allDone ? new Date().toISOString() : null,
      });
      startTransition(async () => {
        await toggleSharedTaskForMe(task.id);
      });
      return;
    }

    const next: TaskStatus =
      mode === "cycle" ? CYCLE_NEXT[task.status] : done ? "todo" : "done";
    updateLocal(task.id, {
      status: next,
      completedAt: next === "done" ? new Date().toISOString() : null,
    });
    startTransition(async () => {
      await setTaskStatus(task.id, next);
    });
  };

  const checked = task.isShared ? mineDone : done;
  const dot = task.isShared ? false : inProgress;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={pending}
      aria-label={checked ? "Marquer comme non fait" : "Marquer comme fait"}
      title={
        task.isShared
          ? mineDone
            ? "Annuler ma validation"
            : "Valider ma part"
          : checked
            ? "Marquer comme non fait"
            : "Marquer comme fait"
      }
      className={`shrink-0 inline-flex items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
        checked
          ? "bg-text border-text text-bg"
          : dot
            ? "border-text-2"
            : "border-text-3 hover:border-text"
      }`}
      style={{ width: size, height: size }}
    >
      {checked && <Check size={size - 5} strokeWidth={3} />}
      {dot && !checked && (
        <span
          className="rounded-[1px] bg-text-2"
          style={{ width: size - 8, height: size - 8 }}
        />
      )}
    </button>
  );
}
