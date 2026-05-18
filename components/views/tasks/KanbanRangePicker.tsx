"use client";

import { CalendarRange } from "lucide-react";
import {
  RANGE_LABEL,
  resolveRange,
  type KanbanRange,
  type KanbanRangePreset,
} from "./kanbanRange";

interface Props {
  value: KanbanRange;
  onChange: (next: KanbanRange) => void;
}

const PRESETS: KanbanRangePreset[] = ["today", "tomorrow", "week", "month", "custom"];

export function KanbanRangePicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10.5px] text-text-3 font-mono uppercase tracking-wide pr-1">
        <CalendarRange size={11} strokeWidth={1.5} />
        Plage
      </span>
      <div className="inline-flex h-7 bg-bg border border-border rounded-full p-0.5 text-[11px]">
        {PRESETS.map((p) => {
          const active = value.preset === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(resolveRange(p, value))}
              className={`px-2.5 rounded-full transition-colors ${
                active ? "bg-surface text-text" : "text-text-3 hover:text-text"
              }`}
            >
              {RANGE_LABEL[p]}
            </button>
          );
        })}
      </div>
      {value.preset === "custom" && (
        <div className="inline-flex items-center gap-1 text-[11px]">
          <input
            type="date"
            value={value.start}
            onChange={(e) =>
              onChange({ ...value, preset: "custom", start: e.target.value })
            }
            className="bg-bg border border-border rounded px-2 h-7 text-text"
          />
          <span className="text-text-3">→</span>
          <input
            type="date"
            value={value.end}
            onChange={(e) =>
              onChange({ ...value, preset: "custom", end: e.target.value })
            }
            className="bg-bg border border-border rounded px-2 h-7 text-text"
          />
        </div>
      )}
    </div>
  );
}
