"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckSquare } from "lucide-react";
import { useStore, selectCurrentUser, selectTodayTasks } from "@/lib/store";
import { TaskRow } from "@/components/views/tasks/TaskRow";
import { TaskDialog } from "@/components/views/tasks/TaskDialog";
import type { Task } from "@/lib/types";

export function TasksTodayCard() {
  const me = useStore(selectCurrentUser);
  const today = useStore(selectTodayTasks(me?.id ?? ""));
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[13px] text-text font-medium">
          <CheckSquare size={13} strokeWidth={1.4} />
          Tâches du jour
        </div>
        <Link
          href="/tasks"
          className="text-[10.5px] text-text-3 hover:text-text inline-flex items-center gap-1 font-mono"
        >
          Toutes
          <ArrowRight size={10} strokeWidth={1.4} />
        </Link>
      </div>
      {today.length === 0 ? (
        <div className="text-[11.5px] text-text-3 italic py-2">
          Rien d'urgent aujourd'hui.
        </div>
      ) : (
        <div className="-mx-2">
          {today.slice(0, 4).map((t) => (
            <TaskRow key={t.id} task={t} onOpen={setEditing} />
          ))}
        </div>
      )}
      <TaskDialog
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
