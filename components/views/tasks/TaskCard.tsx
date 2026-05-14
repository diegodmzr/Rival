"use client";

import { Flag } from "lucide-react";
import { useStore, selectSubtasks } from "@/lib/store";
import type { Task } from "@/lib/types";

const PRIORITY_COLOR = {
  low: "text-text-3",
  normal: "text-text-2",
  high: "text-accent",
} as const;

export function TaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (t: Task) => void;
}) {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const subtasks = useStore(selectSubtasks(task.id));
  const project = task.projectId
    ? projects.find((p) => p.id === task.projectId)
    : null;
  const assignee = task.assignedUserId ? users[task.assignedUserId] : null;
  const doneCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div
      onClick={() => onOpen(task)}
      className="bg-surface border border-border rounded p-2.5 cursor-pointer hover:border-text-3 transition-colors"
    >
      <div className="text-[12.5px] text-text mb-1.5 leading-snug">
        {task.title}
      </div>
      <div className="flex items-center gap-2 text-[10.5px] text-text-3 font-mono">
        {project && (
          <span className="truncate max-w-[100px]">{project.name}</span>
        )}
        {task.priority !== "normal" && (
          <Flag size={10} className={PRIORITY_COLOR[task.priority]} />
        )}
        {task.dueDate && <span>{task.dueDate.slice(5)}</span>}
        {subtasks.length > 0 && (
          <span>
            {doneCount}/{subtasks.length}
          </span>
        )}
        {assignee && <span className="ml-auto">{assignee.initials}</span>}
      </div>
    </div>
  );
}
