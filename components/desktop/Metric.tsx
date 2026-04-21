"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { fmt, fmtDiff, fmtParts } from "@/lib/format";
import type { UserId } from "@/lib/types";

interface MetricProps {
  label: string;
  value: number;
  rivalValue: number;
  rivalId: UserId;
}

export function Metric({ label, value, rivalValue, rivalId }: MetricProps) {
  const rivalUser = useStore((s) => s.users[rivalId]);
  const diff = value - rivalValue;
  const leading = diff >= 0;
  const parts = fmtParts(value);
  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-3 min-h-[126px]">
      <div className="flex items-center justify-between">
        <div className="text-[11.5px] text-text-3 uppercase tracking-[0.6px]">{label}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="font-mono text-[32px] text-text font-medium tracking-[-0.5px]">
          {parts.main}
          <span className="text-[16px] text-text-3 ml-[2px]">{parts.suffix}</span>
        </div>
      </div>
      <div className="flex items-center gap-[6px] text-[11px] text-text-3 font-mono">
        <Avatar userId={rivalId} size={14} />
        <span>
          {rivalUser?.name ?? rivalId} · {fmt(rivalValue)}
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-[3px] ${
            leading ? "text-text" : "text-text-2"
          }`}
        >
          {leading ? (
            <ArrowUp size={10} strokeWidth={1.6} />
          ) : (
            <ArrowDown size={10} strokeWidth={1.6} />
          )}
          {fmtDiff(value, rivalValue)}
        </span>
      </div>
    </div>
  );
}
