"use client";

import { List, Columns3, Calendar } from "lucide-react";
import type { TasksView } from "@/lib/store";

interface Props {
  value: TasksView;
  onChange: (v: TasksView) => void;
}

const ITEMS: { v: TasksView; label: string; Icon: typeof List }[] = [
  { v: "list", label: "Liste", Icon: List },
  { v: "kanban", label: "Kanban", Icon: Columns3 },
  { v: "calendar", label: "Calendrier", Icon: Calendar },
];

export function TasksViewSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-bg border border-border rounded p-0.5 text-[11.5px]">
      {ITEMS.map(({ v, label, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            value === v
              ? "bg-surface text-text"
              : "text-text-3 hover:text-text"
          }`}
        >
          <Icon size={12} strokeWidth={1.3} />
          {label}
        </button>
      ))}
    </div>
  );
}
