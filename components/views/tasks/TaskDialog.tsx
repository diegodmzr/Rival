"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { X, Flag, Users, Calendar, Folder, User as UserIcon, Circle, CircleDashed, CheckCircle2, Repeat } from "lucide-react";
import { useStore } from "@/lib/store";
import { createTask, updateTask, deleteTask, deleteTaskSeries } from "@/lib/actions/tasks";
import { PRIORITY_FLAG, PRIORITY_LABEL } from "@/lib/taskPriority";
import { generateOccurrenceDates } from "@/lib/recurrence";
import { TaskAttachmentsEditor } from "./TaskAttachmentsEditor";
import { RecurrenceEditor } from "./RecurrenceEditor";
import type {
  RecurrenceRule,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaults?: {
    projectId?: string | null;
    parentTaskId?: string | null;
    dueDate?: string | null;
  };
}

const FIELD =
  "w-full bg-bg border border-border rounded-md px-3 py-2 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:border-text-3";
const FIELD_SMALL =
  "w-full bg-bg border border-border rounded-md px-2.5 py-1.5 text-[12px] text-text focus:outline-none focus:border-text-3";
const LABEL = "text-[10.5px] text-text-3 uppercase tracking-wide font-mono";

const STATUS_META: { v: TaskStatus; label: string; Icon: typeof Circle }[] = [
  { v: "todo", label: "À faire", Icon: Circle },
  { v: "in_progress", label: "En cours", Icon: CircleDashed },
  { v: "done", label: "Terminée", Icon: CheckCircle2 },
];

export function TaskDialog({ open, onClose, task, defaults }: Props) {
  const projects = useStore((s) => s.projects);
  const users = useStore((s) => s.users);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isMother = !!task?.recurrence;
  const isOccurrence = !!task?.recurrenceParentId;
  const lockedToSeries = isMother || isOccurrence;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setProjectId(task.projectId);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate);
      setAssignedUserId(task.assignedUserId);
      setIsShared(task.isShared);
      setRecurrence(task.recurrence);
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaults?.projectId ?? null);
      setPriority("normal");
      setStatus("todo");
      setDueDate(defaults?.dueDate ?? null);
      setAssignedUserId(null);
      setIsShared(false);
      setRecurrence(null);
    }
    setError(null);
  }, [open, task, defaults]);

  const previewDates = useMemo(() => {
    if (!recurrence || !dueDate || task) return [];
    return generateOccurrenceDates(recurrence, dueDate).slice(0, 4);
  }, [recurrence, dueDate, task]);

  if (!open) return null;

  const save = () => {
    setError(null);
    startTransition(async () => {
      let res;
      if (task) {
        res = await updateTask(task.id, {
          title,
          description,
          priority,
          status,
          dueDate,
          assignedUserId: isShared ? null : assignedUserId,
          isShared: isShared !== task.isShared ? isShared : undefined,
        });
      } else {
        res = await createTask({
          projectId,
          parentTaskId: defaults?.parentTaskId ?? null,
          title,
          description,
          priority,
          dueDate,
          assignedUserId: isShared ? null : assignedUserId,
          isShared,
          recurrence,
        });
      }
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      onClose();
    });
  };

  const remove = () => {
    if (!task) return;
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      onClose();
    });
  };

  const removeSeries = () => {
    if (!task) return;
    const motherId = task.recurrenceParentId ?? task.id;
    if (!window.confirm("Supprimer toute la série de tâches récurrentes ?")) return;
    startTransition(async () => {
      const res = await deleteTaskSeries(motherId);
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-lg bg-surface border border-border shadow-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-[6px] sm:hidden" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="text-[14px] text-text font-medium">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text"
            aria-label="Fermer"
          >
            <X size={14} strokeWidth={1.3} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              className={`${FIELD} text-[14px] font-medium`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              rows={2}
              className={`${FIELD} resize-none text-[12px]`}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsShared((v) => !v)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-[12px] border transition-colors ${
              isShared
                ? "border-text-2 bg-bg"
                : "border-border hover:border-text-3 bg-bg/50"
            }`}
          >
            <span className="flex items-center gap-2 text-left">
              <Users
                size={13}
                strokeWidth={1.5}
                className={isShared ? "text-text" : "text-text-3"}
              />
              <span className="flex flex-col">
                <span className={isShared ? "text-text" : "text-text-2"}>
                  Tâche partagée
                </span>
                <span className="text-[10.5px] text-text-3">
                  Doit être validée par les deux rivals
                </span>
              </span>
            </span>
            <span
              className={`inline-block h-4 w-7 rounded-full border transition-colors relative shrink-0 ${
                isShared ? "bg-text border-text" : "border-border bg-bg"
              }`}
            >
              <span
                className={`absolute top-[1px] h-3 w-3 rounded-full transition-all ${
                  isShared ? "left-[13px] bg-bg" : "left-[1px] bg-text-3"
                }`}
              />
            </span>
          </button>

          {lockedToSeries && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bg/40 text-[11.5px] text-text-2">
              <Repeat size={12} strokeWidth={1.5} className="text-text-3" />
              <span className="flex-1">
                {isMother
                  ? "Tâche mère d'une série récurrente"
                  : "Occurrence d'une série récurrente"}
              </span>
              <button
                type="button"
                onClick={removeSeries}
                disabled={pending}
                className="text-[10.5px] text-text-3 hover:text-red-400 disabled:opacity-50"
              >
                Supprimer la série
              </button>
            </div>
          )}

          {!task && (
            <RecurrenceEditor
              value={recurrence}
              onChange={setRecurrence}
              previewDates={previewDates}
            />
          )}

          <div className="space-y-1.5">
            <div className={LABEL}>Détails</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Folder
                  size={11}
                  strokeWidth={1.5}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
                <select
                  value={projectId ?? ""}
                  onChange={(e) => setProjectId(e.target.value || null)}
                  className={`${FIELD_SMALL} pl-7 appearance-none`}
                  disabled={!!task}
                >
                  <option value="">Sans projet</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Calendar
                  size={11}
                  strokeWidth={1.5}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                />
                <input
                  type="date"
                  value={dueDate ?? ""}
                  onChange={(e) => setDueDate(e.target.value || null)}
                  className={`${FIELD_SMALL} pl-7`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className={LABEL}>Priorité</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(["low", "normal", "high"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-colors min-w-0 ${
                    priority === p
                      ? "border-text-2 text-text bg-bg"
                      : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
                  }`}
                >
                  <Flag
                    size={10}
                    strokeWidth={1.5}
                    className={PRIORITY_FLAG[p]}
                    fill="currentColor"
                    fillOpacity={0.22}
                  />
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {!isShared && (
            <div className="space-y-1.5">
              <div className={LABEL}>Assignation</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAssignedUserId(null)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-colors ${
                    assignedUserId === null
                      ? "border-text-2 text-text bg-bg"
                      : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
                  }`}
                >
                  <UserIcon size={10} strokeWidth={1.5} />
                  Commune
                </button>
                {Object.values(users).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssignedUserId(u.id)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-colors truncate ${
                      assignedUserId === u.id
                        ? "border-text-2 text-text bg-bg"
                        : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-70">
                      {u.initials}
                    </span>
                    <span className="truncate">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {task && !isShared && (
            <div className="space-y-1.5">
              <div className={LABEL}>Statut</div>
              <div className="grid grid-cols-3 gap-1.5">
                {STATUS_META.map(({ v, label, Icon }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStatus(v)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] border transition-colors ${
                      status === v
                        ? "border-text-2 text-text bg-bg"
                        : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
                    }`}
                  >
                    <Icon size={10} strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {task && (
            <div className="space-y-1.5">
              <div className={LABEL}>Pièces jointes</div>
              <TaskAttachmentsEditor taskId={task.id} />
            </div>
          )}

          {error && <div className="text-[11px] text-red-400">{error}</div>}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          {task ? (
            <button
              onClick={remove}
              disabled={pending}
              className="text-[11.5px] text-text-3 hover:text-red-400 disabled:opacity-50"
            >
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] text-text-3 hover:text-text"
            >
              Annuler
            </button>
            <button
              onClick={save}
              disabled={pending || !title.trim()}
              className="px-3 py-1.5 rounded-md bg-text text-bg text-[12px] disabled:opacity-50 hover:opacity-90"
            >
              {task ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
