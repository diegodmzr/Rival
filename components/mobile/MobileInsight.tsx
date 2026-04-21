"use client";

import { Sparkles, ChevronRight } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { weekHours } from "@/lib/compute";
import { fmt } from "@/lib/format";

export function MobileInsight() {
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const mine = weekHours(entries, me.id);
  const theirs = weekHours(entries, rival.id);
  const diff = mine - theirs;
  const gap = Math.abs(diff);

  return (
    <div className="mx-4 mb-[14px] px-[14px] py-[11px] bg-surface border border-border rounded-lg flex items-center gap-[10px] text-[12.5px]">
      <Sparkles size={14} strokeWidth={1.3} className="text-text-2" />
      <div className="text-text flex-1 leading-[1.35]">
        {gap < 0.01 ? (
          <>Égalité parfaite cette semaine.</>
        ) : diff >= 0 ? (
          <>
            Tu mènes la semaine de <span className="font-mono">{fmt(gap)}</span>.
          </>
        ) : (
          <>
            {rival.name} mène la semaine de{" "}
            <span className="font-mono">{fmt(gap)}</span>.
          </>
        )}
      </div>
      <ChevronRight size={11} strokeWidth={1.4} className="text-text-4" />
    </div>
  );
}
