"use client";

import { Plus } from "lucide-react";
import { TimerBar } from "./TimerBar";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { formatHeaderDate } from "@/lib/date";
import { todayHours, weekHours } from "@/lib/compute";
import { dashboardSubcopy } from "@/lib/homeCopy";

export function TopBar() {
  const currentUser = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);
  const entries = useStore((s) => s.entries);
  const openQuickAdd = useStore((s) => s.openQuickAdd);
  const hr = new Date().getHours();
  const hello = hr < 12 ? "Bonjour" : hr < 18 ? "Bon après-midi" : "Bonsoir";

  const sub = dashboardSubcopy({
    todayHours: todayHours(entries, currentUser.id),
    meWeek: weekHours(entries, currentUser.id),
    rivalWeek: weekHours(entries, rival.id),
    rivalName: rival.name,
  });

  return (
    <div className="px-7 pt-6 pb-[22px] border-b border-border flex items-end gap-[18px]">
      <div className="flex-1">
        <div className="text-[11.5px] text-text-3 font-mono uppercase tracking-[0.8px]">
          {formatHeaderDate()}
        </div>
        <div className="text-[26px] font-medium tracking-[-0.6px] text-text mt-1">
          {hello}, {currentUser.name}.
        </div>
        {sub && (
          <div className="text-[12px] text-text-2 mt-[2px]">{sub}</div>
        )}
      </div>
      <TimerBar />
      <button
        onClick={openQuickAdd}
        type="button"
        className="flex items-center gap-2 px-[14px] py-2 rounded-md bg-text text-[#050505] border-0 text-[12.5px] font-medium cursor-pointer hover:opacity-90"
      >
        <Plus size={14} strokeWidth={1.4} />
        Ajouter des heures
        <span className="font-mono text-[10px] px-[4px] py-px rounded-[3px] ml-1 text-[rgba(5,5,5,0.5)] bg-[rgba(5,5,5,0.12)]">
          N
        </span>
      </button>
    </div>
  );
}
