"use client";

import { Heatmap } from "@/components/primitives/Heatmap";
import { useStore } from "@/lib/store";
import { heatmapCells, streakDays, longestStreak } from "@/lib/compute";

export function StreakCard() {
  const entries = useStore((s) => s.entries);
  const currentUserId = useStore((s) => s.currentUserId);
  const cells = heatmapCells(entries, currentUserId, 91);
  const streak = streakDays(entries, currentUserId);
  const record = longestStreak(entries, currentUserId);

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] text-text font-medium">Activité — 13 semaines</div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            Streak{" "}
            <span className="font-mono text-text">{streak} {streak > 1 ? "jours" : "jour"}</span>
            <span className="text-text-4 mx-[6px]">·</span>
            record <span className="font-mono text-text-2">{record}</span>
          </div>
        </div>
      </div>
      <Heatmap days={cells} cell={11} gap={3} />
      <div className="flex items-center gap-[6px] text-[10px] text-text-4 font-mono ml-auto">
        <span>moins</span>
        {[0.08, 0.22, 0.4, 0.65, 0.95].map((v, i) => (
          <div
            key={i}
            className="w-[9px] h-[9px] rounded-[2px]"
            style={{ background: `rgba(250,250,250,${v})` }}
          />
        ))}
        <span>plus</span>
      </div>
    </div>
  );
}
