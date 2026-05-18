"use client";

import { useDraggable } from "@dnd-kit/core";
import { PRIORITY_DOT } from "@/lib/taskPriority";
import { TaskCheckbox } from "./TaskCheckbox";
import type { Task } from "@/lib/types";

export function TaskChip({
  task,
  onClick,
}: {
  task: Task;
  onClick: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  const done = task.status === "done";
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : done ? 0.55 : 1 }}
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded bg-surface border text-[10.5px] truncate hover:border-text-3 transition-colors ${
        done
          ? "border-border/60 text-text-3 line-through"
          : "border-border text-text"
      }`}
    >
      <TaskCheckbox task={task} mode="binary" size={13} />
      <span
        {...attributes}
        {...listeners}
        onClick={(e) => {
          e.stopPropagation();
          onClick(task);
        }}
        className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`}
          aria-label={`Priorité ${task.priority}`}
        />
        <span className="truncate">{task.title}</span>
      </span>
    </div>
  );
}
