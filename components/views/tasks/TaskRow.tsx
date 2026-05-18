"use client";

import { useTransition } from "react";
import { Circle, CircleDashed, CheckCircle2, Flag, AlignLeft, Paperclip, Calendar, Repeat, Check } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useShallow } from "zustand/react/shallow";
import {
  useStore,
  selectSubtasks,
  selectTaskHours,
  selectTaskAttachmentsCount,
} from "@/lib/store";
import { setTaskStatus, toggleSharedTaskForMe } from "@/lib/actions/tasks";
import { fmt } from "@/lib/format";
import { PRIORITY_FLAG } from "@/lib/taskPriority";
import { todayISO } from "@/lib/date";
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
  const currentUserId = useStore((s) => s.currentUserId);
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

  const toggleMine = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  };

  const assignee = task.assignedUserId ? users[task.assignedUserId] : null;
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const done = task.status === "done";
  const overdue = !!task.dueDate && !done && task.dueDate < todayISO();
  const isRecurring = !!task.recurrence || !!task.recurrenceParentId;
  const hasMeta =
    !!project ||
    !!task.dueDate ||
    task.description.trim().length > 0 ||
    attachmentsCount > 0 ||
    hours > 0 ||
    isRecurring ||
    (!!assignee && !task.isShared);

  return (
    <>
      <div
        onClick={() => onOpen(task)}
        className="group flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-bg cursor-pointer transition-colors"
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        {task.isShared ? (
          <div className="flex items-center gap-1 shrink-0">
            {Object.values(users).map((u) => {
              const checked = task.completedUserIds.includes(u.id);
              const isMe = u.id === currentUserId;
              return (
                <button
                  key={u.id}
                  onClick={isMe ? toggleMine : (e) => e.stopPropagation()}
                  disabled={pending || !isMe}
                  title={
                    isMe
                      ? checked
                        ? "Décocher ma validation"
                        : "Valider ma part"
                      : `${u.name} ${checked ? "a validé" : "n'a pas encore validé"}`
                  }
                  className={`relative inline-flex items-center justify-center transition-opacity ${
                    checked ? "opacity-100" : "opacity-40"
                  } ${isMe ? "hover:opacity-90 cursor-pointer" : "cursor-default"}`}
                >
                  <Avatar userId={u.id} size={18} />
                  {checked && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-[10px] w-[10px] rounded-full bg-emerald-400 border border-surface flex items-center justify-center">
                      <Check size={6} strokeWidth={3} className="text-bg" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            onClick={cycle}
            disabled={pending}
            className="shrink-0 p-0.5 -m-0.5"
            aria-label="Changer statut"
          >
            <Icon
              size={14}
              strokeWidth={1.4}
              className={
                done
                  ? "text-text-3"
                  : "text-text-2 group-hover:text-text transition-colors"
              }
            />
          </button>
        )}

        <Flag
          size={11}
          strokeWidth={1.4}
          className={`${PRIORITY_FLAG[task.priority]} shrink-0`}
          fill="currentColor"
          fillOpacity={0.18}
        />

        <span
          className={`text-[13px] flex-1 truncate ${
            done ? "text-text-3 line-through" : "text-text"
          }`}
        >
          {task.title}
        </span>

        {hasMeta && (
          <div className="flex items-center gap-2 sm:gap-2.5 text-text-3 shrink-0">
            {project && depth === 0 && (
              <span className="hidden sm:inline text-[10.5px] truncate max-w-[110px]">
                {project.name}
              </span>
            )}
            {isRecurring && (
              <span title="Tâche récurrente" className="inline-flex">
                <Repeat
                  size={11}
                  strokeWidth={1.5}
                  aria-label="Tâche récurrente"
                />
              </span>
            )}
            {task.description.trim().length > 0 && (
              <AlignLeft
                size={11}
                strokeWidth={1.4}
                aria-label="Description"
                className="hidden sm:inline"
              />
            )}
            {attachmentsCount > 0 && (
              <span className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono">
                <Paperclip size={10} strokeWidth={1.4} />
                {attachmentsCount}
              </span>
            )}
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10.5px] font-mono ${
                  overdue ? "text-red-400" : ""
                }`}
              >
                <Calendar size={9} strokeWidth={1.5} />
                {task.dueDate.slice(5)}
              </span>
            )}
            {hours > 0 && (
              <span className="hidden sm:inline text-[10.5px] font-mono">
                {fmt(hours)}
              </span>
            )}
            {assignee && !task.isShared && (
              <span title={assignee.name} className="inline-flex">
                <Avatar userId={assignee.id} size={18} />
              </span>
            )}
          </div>
        )}
      </div>
      {subtasks.map((sub) => (
        <TaskRow key={sub.id} task={sub} onOpen={onOpen} depth={depth + 1} />
      ))}
    </>
  );
}
