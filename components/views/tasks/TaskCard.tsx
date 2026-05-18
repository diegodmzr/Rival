"use client";

import { Flag, AlignLeft, Paperclip, Check } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore, selectSubtasks, selectTaskAttachmentsCount } from "@/lib/store";
import { PRIORITY_FLAG } from "@/lib/taskPriority";
import { Avatar } from "@/components/primitives/Avatar";
import { TaskCheckbox } from "./TaskCheckbox";
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
  const done = task.status === "done";

  return (
    <div
      onClick={() => onOpen(task)}
      className={`bg-surface border rounded p-2.5 cursor-pointer hover:border-text-3 transition-colors ${
        done ? "border-border/60 opacity-60" : "border-border"
      }`}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <div className="pt-[2px]">
          <TaskCheckbox task={task} mode="cycle" size={15} />
        </div>
        <div
          className={`text-[12.5px] leading-snug flex-1 min-w-0 ${
            done ? "text-text-3 line-through" : "text-text"
          }`}
        >
          {task.title}
        </div>
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
        {task.isShared ? (
          <span className="ml-auto flex items-center gap-1">
            {Object.values(users).map((u) => {
              const checked = task.completedUserIds.includes(u.id);
              return (
                <span
                  key={u.id}
                  title={`${u.name} ${checked ? "a validé" : "pas encore"}`}
                  className={`relative inline-flex transition-opacity ${
                    checked ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <Avatar userId={u.id} size={16} />
                  {checked && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-[9px] w-[9px] rounded-full bg-emerald-400 border border-surface flex items-center justify-center">
                      <Check size={5} strokeWidth={3} className="text-bg" />
                    </span>
                  )}
                </span>
              );
            })}
          </span>
        ) : (
          assignee && (
            <span title={assignee.name} className="ml-auto inline-flex">
              <Avatar userId={assignee.id} size={16} />
            </span>
          )
        )}
      </div>
    </div>
  );
}
