"use client";

import { Folder, Inbox, Paperclip, Check, Calendar, Repeat, ListChecks } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useStore, selectSubtasks, selectTaskAttachmentsCount } from "@/lib/store";
import { PRIORITY_FLAG } from "@/lib/taskPriority";
import { Avatar } from "@/components/primitives/Avatar";
import { TaskCheckbox } from "./TaskCheckbox";
import { todayISO, parseISODate, diffDays } from "@/lib/date";
import type { Task } from "@/lib/types";

const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const WEEKDAYS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];

function formatDueLabel(iso: string): { label: string; overdue: boolean } {
  const today = todayISO();
  const delta = diffDays(iso, today);
  const overdue = delta < 0;
  if (delta === 0) return { label: "Aujourd'hui", overdue: false };
  if (delta === 1) return { label: "Demain", overdue: false };
  if (delta === -1) return { label: "Hier", overdue: true };
  if (delta > 1 && delta <= 6) {
    const d = parseISODate(iso);
    return { label: WEEKDAYS[d.getDay()], overdue: false };
  }
  const d = parseISODate(iso);
  return {
    label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
    overdue,
  };
}

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
  const subDone = subtasks.filter((s) => s.status === "done").length;
  const done = task.status === "done";
  const isRecurring = !!task.recurrence || !!task.recurrenceParentId;
  const due = task.dueDate ? formatDueLabel(task.dueDate) : null;
  const hasDesc = task.description.trim().length > 0;
  const hasFooter =
    !!due ||
    !!project ||
    subtasks.length > 0 ||
    attachmentsCount > 0 ||
    isRecurring ||
    task.isShared ||
    !!assignee;

  return (
    <div
      onClick={() => onOpen(task)}
      className={`group bg-surface border rounded-md cursor-pointer hover:border-text-3 transition-colors ${
        done ? "border-border/60 opacity-60" : "border-border"
      }`}
    >
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-start gap-2.5">
          <div className="pt-[1px]">
            <TaskCheckbox task={task} mode="cycle" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-[13px] leading-snug font-medium ${
                done ? "text-text-3 line-through" : "text-text"
              }`}
            >
              {task.title}
            </div>
            {hasDesc && (
              <div className="text-[11.5px] text-text-3 mt-0.5 line-clamp-2 leading-snug">
                {task.description}
              </div>
            )}
          </div>
          <span
            className={`mt-[3px] inline-block w-[6px] h-[6px] rounded-full shrink-0 ${
              PRIORITY_FLAG[task.priority].replace("text-", "bg-")
            }`}
            aria-label={`Priorité ${task.priority}`}
          />
        </div>
      </div>

      {hasFooter && (
        <div className="px-3 pb-2.5 flex items-center gap-2 text-[10.5px] text-text-3 flex-wrap">
          {due && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-[2px] rounded border ${
                due.overdue
                  ? "border-red-500/40 text-red-400 bg-red-500/5"
                  : "border-border bg-bg/50"
              }`}
            >
              <Calendar size={9} strokeWidth={1.6} />
              {due.label}
            </span>
          )}

          {project ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded border border-border bg-bg/50">
              <Folder size={9} strokeWidth={1.6} />
              <span className="truncate max-w-[100px]">{project.name}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded border border-border bg-bg/50">
              <Inbox size={9} strokeWidth={1.6} />
              Libre
            </span>
          )}

          {isRecurring && (
            <span title="Tâche récurrente" className="inline-flex items-center">
              <Repeat size={10} strokeWidth={1.6} />
            </span>
          )}

          {subtasks.length > 0 && (
            <span className="inline-flex items-center gap-0.5 font-mono">
              <ListChecks size={10} strokeWidth={1.6} />
              {subDone}/{subtasks.length}
            </span>
          )}

          {attachmentsCount > 0 && (
            <span className="inline-flex items-center gap-0.5 font-mono">
              <Paperclip size={10} strokeWidth={1.6} />
              {attachmentsCount}
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
      )}
    </div>
  );
}
