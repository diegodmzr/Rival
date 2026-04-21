"use client";

import { Flame } from "lucide-react";
import { Heatmap } from "@/components/primitives/Heatmap";
import { useStore } from "@/lib/store";
import { heatmapCells, streakDays, longestStreak } from "@/lib/compute";

export function MobileStreak() {
  const entries = useStore((s) => s.entries);
  const currentUserId = useStore((s) => s.currentUserId);
  const cells = heatmapCells(entries, currentUserId, 91);
  const streak = streakDays(entries, currentUserId);
  const record = longestStreak(entries, currentUserId);

  return (
    <div className="mx-4 mb-[14px] px-4 py-[14px] bg-surface border border-border rounded-lg">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="flex items-center gap-2">
          <Flame size={14} strokeWidth={1.3} className="text-text" />
          <div className="text-[12.5px] text-text font-medium">Streak</div>
        </div>
        <div className="text-[11px] text-text-3 font-mono">
          <span className="text-text">{streak}j</span> · record {record}j
        </div>
      </div>
      <div style={{ transform: "scale(0.85)", transformOrigin: "left top" }}>
        <Heatmap days={cells} cell={10} gap={3} />
      </div>
    </div>
  );
}
