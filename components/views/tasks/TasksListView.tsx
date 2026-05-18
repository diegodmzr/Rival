"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  AlertCircle,
  Sun,
  CalendarDays,
  Calendar,
  CircleSlash,
  CheckCircle2,
  Plus,
  CheckSquare,
} from "lucide-react";
import { TaskRow } from "./TaskRow";
import { TaskDialog } from "./TaskDialog";
import { todayISO } from "@/lib/date";
import type { Task } from "@/lib/types";

interface Props {
  tasks: Task[];
}

type GroupKey = "overdue" | "today" | "week" | "later" | "none" | "done";

const GROUP_META: Record<
  GroupKey,
  { label: string; Icon: typeof Sun; accent: string }
> = {
  overdue: {
    label: "En retard",
    Icon: AlertCircle,
    accent: "text-red-400",
  },
  today: {
    label: "Aujourd'hui",
    Icon: Sun,
    accent: "text-amber-400",
  },
  week: {
    label: "Cette semaine",
    Icon: CalendarDays,
    accent: "text-text-2",
  },
  later: {
    label: "Plus tard",
    Icon: Calendar,
    accent: "text-text-3",
  },
  none: {
    label: "Sans échéance",
    Icon: CircleSlash,
    accent: "text-text-3",
  },
  done: {
    label: "Terminées",
    Icon: CheckCircle2,
    accent: "text-text-3",
  },
};

function groupTasks(tasks: Task[]): Record<GroupKey, Task[]> {
  const today = todayISO();
  const todayDate = new Date(today);
  const groups: Record<GroupKey, Task[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    none: [],
    done: [],
  };
  for (const t of tasks) {
    if (t.parentTaskId) continue;
    if (t.status === "done") {
      groups.done.push(t);
      continue;
    }
    if (!t.dueDate) {
      groups.none.push(t);
      continue;
    }
    if (t.dueDate < today) {
      groups.overdue.push(t);
      continue;
    }
    if (t.dueDate === today) {
      groups.today.push(t);
      continue;
    }
    const due = new Date(t.dueDate);
    const days = Math.round((due.getTime() - todayDate.getTime()) / 86_400_000);
    if (days <= 7) groups.week.push(t);
    else groups.later.push(t);
  }
  return groups;
}

function groupDueHint(key: GroupKey): string | null {
  if (key === "today") return todayISO();
  if (key === "overdue") return todayISO();
  return null;
}

export function TasksListView({ tasks }: Props) {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<{ dueDate: string | null } | null>(
    null,
  );

  const order: GroupKey[] = ["overdue", "today", "week", "later", "none"];
  const hasAny =
    order.some((k) => groups[k].length > 0) || groups.done.length > 0;

  if (!hasAny) {
    return (
      <>
        <div className="border border-dashed border-border rounded-md py-12 px-6 flex flex-col items-center text-center">
          <div className="h-9 w-9 rounded-full border border-border flex items-center justify-center mb-3 text-text-3">
            <CheckSquare size={15} strokeWidth={1.4} />
          </div>
          <div className="text-[13px] text-text mb-1">Aucune tâche</div>
          <div className="text-[11.5px] text-text-3 mb-4 max-w-[260px]">
            Ajuste tes filtres ou crée ta première tâche pour commencer.
          </div>
          <button
            onClick={() => setCreating({ dueDate: null })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-text text-bg text-[11.5px] hover:opacity-90"
          >
            <Plus size={11} strokeWidth={1.8} /> Nouvelle tâche
          </button>
        </div>
        <TaskDialog
          open={!!creating}
          onClose={() => setCreating(null)}
          defaults={{ dueDate: creating?.dueDate ?? null }}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {order.map((key) => {
        const list = groups[key];
        if (list.length === 0) return null;
        const { label, Icon, accent } = GROUP_META[key];
        const dueHint = groupDueHint(key);
        return (
          <section key={key}>
            <div className="flex items-center gap-2 mb-1.5 px-2">
              <Icon size={11} strokeWidth={1.5} className={accent} />
              <span className="text-[10.5px] text-text-2 uppercase tracking-wide">
                {label}
              </span>
              <span className="text-[10.5px] text-text-3 font-mono">
                {list.length}
              </span>
              <button
                onClick={() => setCreating({ dueDate: dueHint })}
                className="ml-auto inline-flex items-center gap-0.5 h-5 w-5 justify-center rounded text-text-3 hover:text-text hover:bg-bg transition-colors"
                title="Ajouter dans ce groupe"
                aria-label="Ajouter dans ce groupe"
              >
                <Plus size={11} strokeWidth={1.8} />
              </button>
            </div>
            <div className="bg-surface/40 border border-border/60 rounded-md py-0.5">
              {list.map((t) => (
                <TaskRow key={t.id} task={t} onOpen={setEditing} />
              ))}
            </div>
          </section>
        );
      })}

      {groups.done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[10.5px] text-text-3 hover:text-text px-2 mb-1.5 uppercase tracking-wide"
          >
            <ChevronRight
              size={11}
              className={`transition-transform ${showDone ? "rotate-90" : ""}`}
            />
            <CheckCircle2 size={11} strokeWidth={1.5} />
            {GROUP_META.done.label}
            <span className="font-mono">· {groups.done.length}</span>
          </button>
          {showDone && (
            <div className="bg-surface/40 border border-border/60 rounded-md py-0.5">
              {groups.done.map((t) => (
                <TaskRow key={t.id} task={t} onOpen={setEditing} />
              ))}
            </div>
          )}
        </section>
      )}

      <TaskDialog
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
      <TaskDialog
        open={!!creating}
        onClose={() => setCreating(null)}
        defaults={{ dueDate: creating?.dueDate ?? null }}
      />
    </div>
  );
}
