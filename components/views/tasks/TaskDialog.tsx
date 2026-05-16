"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
import { createTask, updateTask, deleteTask } from "@/lib/actions/tasks";
import { PRIORITY_FLAG, PRIORITY_LABEL } from "@/lib/taskPriority";
import { TaskAttachmentsEditor } from "./TaskAttachmentsEditor";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

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

const INPUT_CLASS =
  "w-full bg-bg border border-border rounded px-3 py-2 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:border-text-3";
const SELECT_CLASS =
  "bg-bg border border-border rounded px-2 py-2 text-[12px] text-text focus:outline-none focus:border-text-3";

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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaults?.projectId ?? null);
      setPriority("normal");
      setStatus("todo");
      setDueDate(defaults?.dueDate ?? null);
      setAssignedUserId(null);
    }
    setError(null);
  }, [open, task, defaults]);

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
          assignedUserId,
        });
      } else {
        res = await createTask({
          projectId,
          parentTaskId: defaults?.parentTaskId ?? null,
          title,
          description,
          priority,
          dueDate,
          assignedUserId,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-surface border border-border p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
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

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la tâche"
            className={INPUT_CLASS}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            }}
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={3}
            className={`${INPUT_CLASS} resize-none text-[12px]`}
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={projectId ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              className={SELECT_CLASS}
              disabled={!!task}
            >
              <option value="">Sans projet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value || null)}
              className={SELECT_CLASS}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(["low", "normal", "high"] as TaskPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[11px] border transition-colors ${
                  priority === p
                    ? "border-text-2 text-text bg-bg"
                    : "border-border text-text-3 hover:text-text-2"
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

          <select
            value={assignedUserId ?? ""}
            onChange={(e) => setAssignedUserId(e.target.value || null)}
            className={`${SELECT_CLASS} w-full`}
          >
            <option value="">Commune / non assignée</option>
            {Object.values(users).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {task && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={`${SELECT_CLASS} w-full`}
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Terminée</option>
            </select>
          )}

          {task && <TaskAttachmentsEditor taskId={task.id} />}

          {error && (
            <div className="text-[11px] text-red-400">{error}</div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
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
              className="px-3 py-1.5 rounded bg-text text-bg text-[12px] disabled:opacity-50"
            >
              {task ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
