"use client";

import { Search, X, Flag, Folder, User as UserIcon, CircleDot } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEFAULT_FILTERS, type TaskFilters } from "./types";

interface Props {
  value: TaskFilters;
  onChange: (next: TaskFilters) => void;
  hideProject?: boolean;
  hideStatus?: boolean;
}

const PILL_BASE =
  "relative inline-flex items-center gap-1.5 h-7 px-2 rounded-full border text-[11px] transition-colors focus:outline-none";

function isDefault(f: TaskFilters): boolean {
  return (
    f.projectId === "all" &&
    f.priority === "all" &&
    f.assignment === "all" &&
    f.status === "all" &&
    f.search.trim() === ""
  );
}

function ChipSelect<T extends string>({
  Icon,
  value,
  defaultValue,
  onChange,
  options,
  maxWidth,
}: {
  Icon: typeof Flag;
  value: T;
  defaultValue: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  maxWidth?: number;
}) {
  const active = value !== defaultValue;
  const current = options.find((o) => o.value === value);
  return (
    <label
      className={`${PILL_BASE} cursor-pointer bg-bg ${
        active
          ? "border-text-2 text-text"
          : "border-border text-text-3 hover:text-text-2 hover:border-text-3"
      }`}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <Icon size={11} strokeWidth={1.5} className="shrink-0" />
      <span className="truncate">{current?.label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={current?.label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TasksFilters({ value, onChange, hideProject, hideStatus }: Props) {
  const projects = useStore((s) => s.projects);
  const patch = (p: Partial<TaskFilters>) => onChange({ ...value, ...p });
  const dirty = !isDefault(value);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="relative w-full sm:w-40">
        <Search
          size={11}
          strokeWidth={1.5}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
        />
        <input
          value={value.search}
          onChange={(e) => patch({ search: e.target.value })}
          placeholder="Rechercher"
          className="bg-bg border border-border rounded-full pl-7 pr-6 h-7 text-[11px] text-text placeholder:text-text-3 w-full focus:outline-none focus:border-text-3"
        />
        {value.search && (
          <button
            onClick={() => patch({ search: "" })}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text"
            aria-label="Effacer la recherche"
          >
            <X size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {!hideProject && (
        <ChipSelect
          Icon={Folder}
          value={value.projectId}
          defaultValue="all"
          onChange={(v) => patch({ projectId: v as TaskFilters["projectId"] })}
          options={[
            { value: "all", label: "Tous projets" },
            { value: "free", label: "Libres" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          maxWidth={160}
        />
      )}

      <ChipSelect
        Icon={Flag}
        value={value.priority}
        defaultValue="all"
        onChange={(v) => patch({ priority: v as TaskFilters["priority"] })}
        options={[
          { value: "all", label: "Priorité" },
          { value: "high", label: "Haute" },
          { value: "normal", label: "Normale" },
          { value: "low", label: "Basse" },
        ]}
      />

      <ChipSelect
        Icon={UserIcon}
        value={value.assignment}
        defaultValue="all"
        onChange={(v) => patch({ assignment: v as TaskFilters["assignment"] })}
        options={[
          { value: "all", label: "Assignation" },
          { value: "me", label: "Moi" },
          { value: "rival", label: "Rival" },
          { value: "common", label: "Commune" },
        ]}
      />

      {!hideStatus && (
        <ChipSelect
          Icon={CircleDot}
          value={value.status}
          defaultValue="all"
          onChange={(v) => patch({ status: v as TaskFilters["status"] })}
          options={[
            { value: "all", label: "Statut" },
            { value: "todo", label: "À faire" },
            { value: "in_progress", label: "En cours" },
            { value: "done", label: "Terminée" },
          ]}
        />
      )}

      {dirty && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-full text-[10.5px] text-text-3 hover:text-text border border-transparent hover:border-border transition-colors"
        >
          <X size={10} strokeWidth={1.5} />
          Effacer
        </button>
      )}
    </div>
  );
}
