"use client";

import { Flag, AlignLeft, Paperclip } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore, selectSubtasks, selectTaskAttachmentsCount } from "@/lib/store";
import { PRIORITY_FLAG } from "@/lib/taskPriority";
import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (t: Task) => void;
}) {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);
  const subtasks = useStore(useShallow(selectSubtasks(task.id)));
  const attachmentsCount = useStore(selectTaskAttachmentsCount(task.id));
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
        <Flag
          size={10}
          strokeWidth={1.4}
          className={PRIORITY_FLAG[task.priority]}
          fill="currentColor"
          fillOpacity={0.18}
        />
        {task.description.trim().length > 0 && (
          <AlignLeft size={10} strokeWidth={1.4} aria-label="Description" />
        )}
        {attachmentsCount > 0 && (
          <span className="flex items-center gap-0.5">
            <Paperclip size={10} strokeWidth={1.4} />
            {attachmentsCount}
          </span>
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
