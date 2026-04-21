"use client";

import { Target } from "lucide-react";
import { HBar } from "@/components/primitives/HBar";
import { useStore } from "@/lib/store";
import { weekHours, monthHours } from "@/lib/compute";
import { fmt, pct } from "@/lib/format";

export function GoalsCard() {
  const entries = useStore((s) => s.entries);
  const currentUser = useStore((s) => s.users[s.currentUserId]);
  const currentUserId = useStore((s) => s.currentUserId);

  const wVal = weekHours(entries, currentUserId);
  const mVal = monthHours(entries, currentUserId);
  const rows = [
    { k: "Semaine", v: wVal, g: currentUser.weeklyGoal },
    { k: "Mois", v: mVal, g: currentUser.monthlyGoal },
  ];

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-text font-medium">Objectifs</div>
        <Target size={12} strokeWidth={1.3} className="text-text-4" />
      </div>
      {rows.map((row) => {
        const p = row.g > 0 ? row.v / row.g : 0;
        return (
          <div key={row.k}>
            <div className="flex items-baseline justify-between mb-[6px]">
              <span className="text-[11.5px] text-text-3">{row.k}</span>
              <span className="font-mono text-[12px] text-text">
                {fmt(row.v)} <span className="text-text-4">/ {row.g}h</span>
              </span>
            </div>
            <HBar value={row.v} max={row.g} />
            <div className="mt-1 text-[10px] text-text-4 font-mono text-right">{pct(p)}</div>
          </div>
        );
      })}
    </div>
  );
}
