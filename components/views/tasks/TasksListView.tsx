"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { TaskDialog } from "./TaskDialog";
import { todayISO } from "@/lib/date";
import type { Task } from "@/lib/types";

interface Props {
  tasks: Task[];
}

type GroupKey = "overdue" | "today" | "week" | "later" | "none" | "done";

const GROUP_LABELS: Record<GroupKey, string> = {
  overdue: "En retard",
  today: "Aujourd'hui",
  week: "Cette semaine",
  later: "Plus tard",
  none: "Sans échéance",
  done: "Terminées",
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

export function TasksListView({ tasks }: Props) {
  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const order: GroupKey[] = ["overdue", "today", "week", "later", "none"];
  const hasAny =
    order.some((k) => groups[k].length > 0) || groups.done.length > 0;

  return (
    <div className="space-y-5">
      {!hasAny && (
        <div className="text-[12px] text-text-3 italic py-6 text-center">
          Aucune tâche pour le moment.
        </div>
      )}

      {order.map((key) => {
        const list = groups[key];
        if (list.length === 0) return null;
        return (
          <section key={key}>
            <div className="text-[10.5px] text-text-3 uppercase tracking-wide mb-1 px-2">
              {GROUP_LABELS[key]}{" "}
              <span className="font-mono">· {list.length}</span>
            </div>
            <div>
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
            className="inline-flex items-center gap-1 text-[10.5px] text-text-3 hover:text-text px-2 mb-1 uppercase tracking-wide"
          >
            <ChevronRight
              size={11}
              className={`transition-transform ${showDone ? "rotate-90" : ""}`}
            />
            {GROUP_LABELS.done}{" "}
            <span className="font-mono">· {groups.done.length}</span>
          </button>
          {showDone &&
            groups.done.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={setEditing} />
            ))}
        </section>
      )}

      <TaskDialog
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
