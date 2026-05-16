"use client";

import { useTransition } from "react";
import { Circle, CircleDashed, CheckCircle2, Flag, AlignLeft, Paperclip } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  useStore,
  selectSubtasks,
  selectTaskHours,
  selectTaskAttachmentsCount,
} from "@/lib/store";
import { setTaskStatus } from "@/lib/actions/tasks";
import { fmt } from "@/lib/format";
import { PRIORITY_FLAG } from "@/lib/taskPriority";
import type { Task, TaskStatus } from "@/lib/types";

const STATUS_ICON = {
  todo: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
} as const;

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  depth?: number;
}

export function TaskRow({ task, onOpen, depth = 0 }: Props) {
  const subtasks = useStore(useShallow(selectSubtasks(task.id)));
  const hours = useStore(selectTaskHours(task.id));
  const attachmentsCount = useStore(selectTaskAttachmentsCount(task.id));
  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [pending, startTransition] = useTransition();
  const Icon = STATUS_ICON[task.status];

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = NEXT_STATUS[task.status];
    updateLocal(task.id, {
      status: next,
      completedAt: next === "done" ? new Date().toISOString() : null,
    });
    startTransition(async () => {
      await setTaskStatus(task.id, next);
    });
  };

  const assignee = task.assignedUserId ? users[task.assignedUserId] : null;
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const done = task.status === "done";

  return (
    <>
      <div
        onClick={() => onOpen(task)}
        className="group flex items-center gap-2.5 py-1.5 rounded hover:bg-bg cursor-pointer"
        style={{ paddingLeft: 8 + depth * 18, paddingRight: 8 }}
      >
        <button
          onClick={cycle}
          disabled={pending}
          className="shrink-0"
          aria-label="Changer statut"
        >
          <Icon
            size={13}
            strokeWidth={1.4}
            className={done ? "text-text-3" : "text-text-2 hover:text-text"}
          />
        </button>
        <span
          className={`text-[13px] flex-1 truncate ${
            done ? "text-text-3 line-through" : "text-text"
          }`}
        >
          {task.title}
        </span>
        {project && depth === 0 && (
          <span className="text-[10.5px] text-text-3 truncate max-w-[100px]">
            {project.name}
          </span>
        )}
        <Flag
          size={11}
          strokeWidth={1.4}
          className={PRIORITY_FLAG[task.priority]}
          fill="currentColor"
          fillOpacity={0.18}
        />
        {task.description.trim().length > 0 && (
          <AlignLeft
            size={11}
            strokeWidth={1.4}
            className="text-text-3"
            aria-label="Description"
          />
        )}
        {attachmentsCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-mono text-text-3">
            <Paperclip size={10} strokeWidth={1.4} />
            {attachmentsCount}
          </span>
        )}
        {task.dueDate && (
          <span className="text-[10.5px] font-mono text-text-3">
            {task.dueDate.slice(5)}
          </span>
        )}
        {hours > 0 && (
          <span className="text-[10.5px] font-mono text-text-3">{fmt(hours)}</span>
        )}
        {assignee && (
          <span className="text-[10px] text-text-3 font-mono">
            {assignee.initials}
          </span>
        )}
      </div>
      {subtasks.map((sub) => (
        <TaskRow key={sub.id} task={sub} onOpen={onOpen} depth={depth + 1} />
      ))}
    </>
  );
}
