"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { KanbanRangePicker } from "./KanbanRangePicker";
import {
  defaultRange,
  filterTasksForKanban,
  type KanbanRange,
} from "./kanbanRange";
import { useStore } from "@/lib/store";
import { setTaskStatus } from "@/lib/actions/tasks";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "À faire" },
  { id: "in_progress", label: "En cours" },
  { id: "done", label: "Terminées" },
];

function DraggableCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpen: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[220px] rounded-md border border-border p-2 transition-colors ${
        isOver ? "bg-surface" : "bg-bg"
      }`}
    >
      <div className="flex items-center justify-between text-[11.5px] mb-2 px-1">
        <span className="text-text-2 uppercase tracking-wide text-[10.5px]">
          {label}
        </span>
        <span className="text-text-3 font-mono">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[60px]">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

export function TasksKanbanView({ tasks }: { tasks: Task[] }) {
  const updateLocal = useStore((s) => s.updateTaskLocal);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [range, setRange] = useState<KanbanRange>(() => defaultRange());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const visibleTasks = useMemo(
    () => filterTasksForKanban(tasks, range),
    [tasks, range],
  );

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of visibleTasks) {
      map[t.status].push(t);
    }
    return map;
  }, [visibleTasks]);

  const active = tasks.find((t) => t.id === activeId);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const next = e.over.id as TaskStatus;
    const id = String(e.active.id);
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === next) return;
    updateLocal(id, {
      status: next,
      completedAt: next === "done" ? new Date().toISOString() : null,
    });
    setTaskStatus(id, next);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="mb-3">
        <KanbanRangePicker value={range} onChange={setRange} />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            status={col.id}
            label={col.label}
            tasks={byStatus[col.id]}
            onOpen={setEditing}
          />
        ))}
      </div>
      <DragOverlay>
        {active && <TaskCard task={active} onOpen={() => {}} />}
      </DragOverlay>
      <TaskDialog
        open={!!editing}
        task={editing}
        onClose={() => setEditing(null)}
      />
    </DndContext>
  );
}
