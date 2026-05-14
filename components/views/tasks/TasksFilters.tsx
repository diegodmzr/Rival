"use client";

import { useStore } from "@/lib/store";
import type { TaskFilters } from "./types";

interface Props {
  value: TaskFilters;
  onChange: (next: TaskFilters) => void;
  hideProject?: boolean;
  hideStatus?: boolean;
}

const SELECT_CLASS =
  "bg-bg border border-border rounded px-2 py-1 text-text-2 focus:outline-none focus:border-text-3";

export function TasksFilters({ value, onChange, hideProject, hideStatus }: Props) {
  const projects = useStore((s) => s.projects);
  const patch = (p: Partial<TaskFilters>) => onChange({ ...value, ...p });

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      {!hideProject && (
        <select
          value={String(value.projectId)}
          onChange={(e) => patch({ projectId: e.target.value as TaskFilters["projectId"] })}
          className={SELECT_CLASS}
        >
          <option value="all">Tous projets</option>
          <option value="free">Libres</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={value.priority}
        onChange={(e) => patch({ priority: e.target.value as TaskFilters["priority"] })}
        className={SELECT_CLASS}
      >
        <option value="all">Priorité</option>
        <option value="high">Haute</option>
        <option value="normal">Normale</option>
        <option value="low">Basse</option>
      </select>
      <select
        value={value.assignment}
        onChange={(e) => patch({ assignment: e.target.value as TaskFilters["assignment"] })}
        className={SELECT_CLASS}
      >
        <option value="all">Assignation</option>
        <option value="me">Moi</option>
        <option value="rival">Rival</option>
        <option value="common">Commune</option>
      </select>
      {!hideStatus && (
        <select
          value={value.status}
          onChange={(e) => patch({ status: e.target.value as TaskFilters["status"] })}
          className={SELECT_CLASS}
        >
          <option value="all">Statut</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminée</option>
        </select>
      )}
      <input
        value={value.search}
        onChange={(e) => patch({ search: e.target.value })}
        placeholder="Rechercher"
        className="bg-bg border border-border rounded px-2 py-1 text-text placeholder:text-text-3 w-32 focus:outline-none focus:border-text-3"
      />
    </div>
  );
}
