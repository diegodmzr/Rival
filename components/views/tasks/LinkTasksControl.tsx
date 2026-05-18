"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { collapseRecurringSeries } from "@/lib/recurrence";
import type { Task } from "@/lib/types";

interface Props {
  projectId: string | null;
  value: string[];
  onChange: (next: string[]) => void;
}

export function LinkTasksControl({ projectId, value, onChange }: Props) {
  const tasks = useStore((s) => s.tasks);
  const [showFree, setShowFree] = useState(false);

  const collapsed = useMemo(() => collapseRecurringSeries(tasks), [tasks]);

  const projectTasks = collapsed
    .filter(
      (t) =>
        t.projectId === projectId &&
        !t.parentTaskId &&
        t.status !== "done",
    )
    .slice(0, 12);
  const freeTasks = collapsed.filter(
    (t) => t.projectId === null && !t.parentTaskId && t.status !== "done",
  );

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  };

  const chip = (t: Task) => {
    const on = value.includes(t.id);
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => toggle(t.id)}
        className={`px-2 py-1 rounded border text-[11px] transition-colors ${
          on
            ? "border-text text-text bg-bg"
            : "border-border text-text-3 hover:text-text"
        }`}
      >
        {t.title}
      </button>
    );
  };

  return (
    <div>
      <div className="text-[10.5px] text-text-3 uppercase tracking-wide mb-1.5">
        Tâches liées (optionnel)
      </div>
      {projectId === null ? null : projectTasks.length === 0 ? (
        <div className="text-[11px] text-text-3 italic">
          Aucune tâche ouverte sur ce projet.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">{projectTasks.map(chip)}</div>
      )}
      {freeTasks.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowFree((v) => !v)}
            className="text-[10.5px] text-text-3 hover:text-text"
          >
            {showFree ? "− Masquer" : "+ Afficher"} tâches libres ({freeTasks.length})
          </button>
          {showFree && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {freeTasks.map(chip)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
