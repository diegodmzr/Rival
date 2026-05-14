"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskChip } from "./TaskChip";
import { TaskDialog } from "./TaskDialog";
import { useStore } from "@/lib/store";
import { updateTask } from "@/lib/actions/tasks";
import { todayISO } from "@/lib/date";
import type { Task } from "@/lib/types";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function DayCell({
  date,
  tasks,
  onOpenTask,
  onCreate,
  compact,
  inCurrentMonth,
}: {
  date: string;
  tasks: Task[];
  onOpenTask: (t: Task) => void;
  onCreate: (date: string) => void;
  compact?: boolean;
  inCurrentMonth?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const today = todayISO() === date;
  const dim = inCurrentMonth === false;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col border-r border-b border-border last:border-r-0 ${
        isOver ? "bg-surface" : ""
      } ${dim ? "opacity-40" : ""} ${compact ? "min-h-[68px] p-1" : "min-h-[140px] p-1.5"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-[10.5px] font-mono ${
            today ? "text-accent" : "text-text-3"
          }`}
        >
          {date.slice(8)}
        </span>
        <button
          onClick={() => onCreate(date)}
          className="text-text-3 hover:text-text text-[11px] leading-none px-1"
          aria-label="Nouvelle tâche"
        >
          +
        </button>
      </div>
      <div className="space-y-0.5 flex-1 overflow-hidden">
        {compact ? (
          <>
            {tasks.slice(0, 3).map((t) => (
              <TaskChip key={t.id} task={t} onClick={onOpenTask} />
            ))}
            {tasks.length > 3 && (
              <div className="text-[9.5px] text-text-3 font-mono">
                +{tasks.length - 3}
              </div>
            )}
          </>
        ) : (
          tasks.map((t) => <TaskChip key={t.id} task={t} onClick={onOpenTask} />)
        )}
      </div>
    </div>
  );
}

export function TasksCalendarView({ tasks }: { tasks: Task[] }) {
  const mode = useStore((s) => s.tasksCalendarMode);
  const setMode = useStore((s) => s.setTasksCalendarMode);
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const days = useMemo(() => {
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(anchor);
        d.setDate(d.getDate() + i);
        return isoDate(d);
      });
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startGrid = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startGrid);
      d.setDate(d.getDate() + i);
      return isoDate(d);
    });
  }, [anchor, mode]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (t.parentTaskId || !t.dueDate) continue;
      (map[t.dueDate] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  const overdue = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.parentTaskId &&
          t.status !== "done" &&
          t.dueDate !== null &&
          t.dueDate < todayISO(),
      ),
    [tasks],
  );

  const undated = useMemo(
    () =>
      tasks.filter(
        (t) => !t.parentTaskId && !t.dueDate && t.status !== "done",
      ),
    [tasks],
  );

  const handleDragEnd = (e: DragEndEvent) => {
    if (!e.over) return;
    const overId = String(e.over.id);
    if (!overId.startsWith("day:")) return;
    const taskId = String(e.active.id);
    const newDate = overId.slice(4);
    updateLocal(taskId, { dueDate: newDate });
    updateTask(taskId, { dueDate: newDate });
  };

  const navPrev = () => {
    setAnchor((a) => {
      const d = new Date(a);
      if (mode === "week") {
        d.setDate(d.getDate() - 7);
        return startOfWeek(d);
      }
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  };
  const navNext = () => {
    setAnchor((a) => {
      const d = new Date(a);
      if (mode === "week") {
        d.setDate(d.getDate() + 7);
        return startOfWeek(d);
      }
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  };
  const navToday = () => {
    const now = new Date();
    setAnchor(
      mode === "week" ? startOfWeek(now) : new Date(now.getFullYear(), now.getMonth(), 1),
    );
  };

  const periodLabel = useMemo(() => {
    if (mode === "week") {
      const end = new Date(anchor);
      end.setDate(end.getDate() + 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      return `${fmt(anchor)} – ${fmt(end)}`;
    }
    return anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [anchor, mode]);

  const currentMonth = anchor.getMonth();

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-center justify-between mb-3 text-[11.5px] flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={navPrev}
            className="text-text-3 hover:text-text px-1"
            aria-label="Précédent"
          >
            <ChevronLeft size={14} strokeWidth={1.4} />
          </button>
          <button
            onClick={navToday}
            className="text-text-3 hover:text-text px-2"
          >
            Aujourd'hui
          </button>
          <button
            onClick={navNext}
            className="text-text-3 hover:text-text px-1"
            aria-label="Suivant"
          >
            <ChevronRight size={14} strokeWidth={1.4} />
          </button>
          <span className="text-text-2 ml-2 capitalize">{periodLabel}</span>
        </div>
        <div className="inline-flex bg-bg border border-border rounded p-0.5">
          {(["week", "month"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded ${
                mode === m ? "bg-surface text-text" : "text-text-3 hover:text-text"
              }`}
            >
              {m === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="mb-3 p-2 rounded border border-border bg-surface">
          <div className="text-[10.5px] text-accent uppercase mb-1.5 tracking-wide">
            En retard · {overdue.length}
          </div>
          <div className="flex flex-wrap gap-1">
            {overdue.map((t) => (
              <TaskChip key={t.id} task={t} onClick={setEditing} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-l border-border rounded overflow-hidden">
        {mode === "month" && (
          <div className="grid grid-cols-7 bg-bg text-[10px] text-text-3 uppercase tracking-wide">
            {WEEKDAYS.map((w, i) => (
              <div
                key={i}
                className="px-2 py-1 border-r border-b border-border last:border-r-0"
              >
                {w}
              </div>
            ))}
          </div>
        )}
        <div
          className={
            mode === "week"
              ? "grid grid-cols-7"
              : "grid grid-cols-7"
          }
        >
          {days.map((d) => (
            <DayCell
              key={d}
              date={d}
              tasks={tasksByDay[d] ?? []}
              onOpenTask={setEditing}
              onCreate={(date) => setCreating(date)}
              compact={mode === "month"}
              inCurrentMonth={
                mode === "month"
                  ? new Date(d).getMonth() === currentMonth
                  : true
              }
            />
          ))}
        </div>
      </div>

      {undated.length > 0 && (
        <div className="mt-3">
          <div className="text-[10.5px] text-text-3 uppercase mb-1.5 tracking-wide">
            À planifier · {undated.length}
          </div>
          <div className="flex flex-wrap gap-1">
            {undated.map((t) => (
              <TaskChip key={t.id} task={t} onClick={setEditing} />
            ))}
          </div>
        </div>
      )}

      <TaskDialog
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
      <TaskDialog
        open={!!creating}
        onClose={() => setCreating(null)}
        defaults={{ dueDate: creating }}
      />
    </DndContext>
  );
}
