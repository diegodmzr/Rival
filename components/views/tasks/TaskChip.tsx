"use client";

import { useDraggable } from "@dnd-kit/core";
import { PRIORITY_DOT } from "@/lib/taskPriority";
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
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-surface border border-border text-[10.5px] text-text truncate cursor-pointer hover:border-text-3 ${
        task.status === "done" ? "line-through text-text-3" : ""
      }`}
    >
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`}
        aria-label={`Priorité ${task.priority}`}
      />
      <span className="truncate">{task.title}</span>
    </div>
  );
}
