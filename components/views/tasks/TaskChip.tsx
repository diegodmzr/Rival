"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";

const PRIORITY_BORDER = {
  low: "border-border",
  normal: "border-border",
  high: "border-accent/60",
} as const;

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
      className={`px-1.5 py-0.5 rounded bg-surface border text-[10.5px] text-text truncate cursor-pointer hover:border-text-3 ${PRIORITY_BORDER[task.priority]} ${
        task.status === "done" ? "line-through text-text-3" : ""
      }`}
    >
      {task.title}
    </div>
  );
}
