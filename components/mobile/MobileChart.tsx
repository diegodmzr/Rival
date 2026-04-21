"use client";

import { LineChart } from "@/components/primitives/LineChart";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { dailySeries } from "@/lib/compute";

const DAYS = ["lu", "ma", "me", "je", "ve", "sa", "di"];

export function MobileChart() {
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const mine = dailySeries(entries, me.id, 7);
  const theirs = dailySeries(entries, rival.id, 7);

  return (
    <div className="mx-4 mb-[14px] px-4 pt-[14px] pb-[10px] bg-surface border border-border rounded-lg">
      <div className="flex justify-between items-center mb-[10px]">
        <div className="text-[12.5px] text-text font-medium">7 derniers jours</div>
        <div className="text-[10px] text-text-3 flex gap-[10px] font-mono">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-[2px] bg-text" />
            Toi
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-[2px] bg-rival" />
            {rival.initials}
          </span>
        </div>
      </div>
      <LineChart
        a={mine}
        b={theirs}
        width={320}
        height={110}
        colors={["#fafafa", "#737373"]}
      />
      <div className="flex justify-between text-[9.5px] text-text-4 font-mono uppercase mt-[2px]">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}
