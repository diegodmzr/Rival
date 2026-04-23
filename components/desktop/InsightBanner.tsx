"use client";

import { Sparkles, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { weekHours, streakDays, bestDay } from "@/lib/compute";
import { fmt } from "@/lib/format";
import { exportEntriesCSV } from "@/lib/export";
import { insightLead } from "@/lib/homeCopy";

export function InsightBanner() {
  const entries = useStore((s) => s.entries);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const projects = useStore((s) => s.projects);

  const ids = Object.keys(users);
  const rivalId = ids.find((i) => i !== currentUserId) ?? currentUserId;

  const meWeek = weekHours(entries, currentUserId);
  const rivalWeek = weekHours(entries, rivalId);
  const streak = streakDays(entries, currentUserId);
  const best = bestDay(entries, currentUserId);
  const lead = insightLead({
    meWeek,
    rivalWeek,
    rivalName: users[rivalId]?.name ?? "",
  });

  return (
    <div className="flex items-center gap-[14px] px-[18px] py-[11px] border-b border-border bg-surface text-[12.5px]">
      <div className="flex items-center gap-[7px] px-2 py-[3px] rounded-[4px] border border-border text-text-2 text-[10.5px] font-mono uppercase tracking-[0.6px]">
        <Sparkles size={11} strokeWidth={1.3} className="text-text-3" />
        Insight
      </div>
      <div className="text-text font-medium">{lead}</div>
      <div className="w-px h-[14px] bg-border" />
      <div className="text-text-2">
        Streak en cours ·{" "}
        <span className="text-text font-mono">{streak} {streak > 1 ? "jours" : "jour"}</span>
      </div>
      {best.hours > 0 && (
        <>
          <div className="w-px h-[14px] bg-border" />
          <div className="text-text-2">
            Meilleur jour{" "}
            <span className="font-mono text-text">{fmt(best.hours)}</span>{" "}
            {best.daysAgo === 0
              ? "aujourd'hui"
              : best.daysAgo === 1
              ? "hier"
              : `il y a ${best.daysAgo} jours`}
          </div>
        </>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => exportEntriesCSV(entries, users, projects)}
        className="flex items-center gap-[6px] px-[10px] py-[5px] rounded-[5px] bg-transparent border border-border text-text-2 text-[11px] cursor-pointer hover:text-text hover:border-border-strong"
      >
        <Download size={12} strokeWidth={1.3} />
        Exporter CSV
      </button>
    </div>
  );
}
