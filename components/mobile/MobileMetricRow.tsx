"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { todayHours, weekHours, monthHours } from "@/lib/compute";
import { fmtDiff, fmtParts } from "@/lib/format";

export function MobileMetricRow() {
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const cells = [
    {
      label: "Auj.",
      me: todayHours(entries, me.id),
      r: todayHours(entries, rival.id),
    },
    {
      label: "Semaine",
      me: weekHours(entries, me.id),
      r: weekHours(entries, rival.id),
    },
    {
      label: "Mois",
      me: monthHours(entries, me.id),
      r: monthHours(entries, rival.id),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-[14px]">
      {cells.map((c) => {
        const diff = c.me - c.r;
        const leading = diff >= 0;
        const parts = fmtParts(c.me);
        return (
          <div
            key={c.label}
            className="bg-surface border border-border rounded-lg px-3 py-[11px]"
          >
            <div className="text-[10px] text-text-3 uppercase tracking-[0.6px] font-mono">
              {c.label}
            </div>
            <div className="text-[22px] font-mono text-text mt-[6px] font-medium tracking-[-0.5px]">
              {parts.main}
              <span className="text-[12px] text-text-3">{parts.suffix}</span>
            </div>
            <div
              className={`flex items-center gap-1 mt-1 text-[10.5px] font-mono ${
                leading ? "text-text-2" : "text-text-3"
              }`}
            >
              {leading ? (
                <ArrowUp size={9} strokeWidth={1.6} />
              ) : (
                <ArrowDown size={9} strokeWidth={1.6} />
              )}
              <span>{fmtDiff(c.me, c.r)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
