"use client";

import { useState } from "react";
import { LineChart } from "@/components/primitives/LineChart";
import { useStore } from "@/lib/store";
import { dailySeries } from "@/lib/compute";
import { fmt } from "@/lib/format";

type Range = "7j" | "30j" | "3m" | "1a";
const RANGES: Range[] = ["7j", "30j", "3m", "1a"];
const DAYS_FOR: Record<Range, number> = { "7j": 7, "30j": 30, "3m": 90, "1a": 365 };

export function ChartCard() {
  const [range, setRange] = useState<Range>("30j");
  const n = DAYS_FOR[range];
  const entries = useStore((s) => s.entries);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const rivalId = Object.keys(users).find((i) => i !== currentUserId) ?? currentUserId;

  const meSeries = dailySeries(entries, currentUserId, n);
  const rivalSeries = dailySeries(entries, rivalId, n);
  const meTotal = meSeries.reduce((a, b) => a + b, 0);
  const rivalTotal = rivalSeries.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] pt-4 pb-2 flex flex-col gap-[14px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] text-text font-medium">Heures quotidiennes</div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            Comparaison sur {range === "1a" ? "12 mois" : range === "3m" ? "3 mois" : `${n} jours`}
          </div>
        </div>
        <div className="flex gap-[2px] bg-surface2 border border-border rounded-[5px] p-[2px]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              type="button"
              className={`px-[10px] py-1 text-[11px] rounded-[3px] font-mono cursor-pointer ${
                r === range
                  ? "text-text bg-white/[0.06]"
                  : "text-text-3 bg-transparent hover:text-text-2"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 text-[11px]">
        <div className="flex items-center gap-[6px] text-text-2">
          <div className="w-[14px] h-[2px] bg-text" />
          <span>Toi</span>
          <span className="text-text-4 font-mono">{fmt(meTotal)}</span>
        </div>
        <div className="flex items-center gap-[6px] text-text-2">
          <div
            className="w-[14px] h-[2px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #737373 0 3px, transparent 3px 6px)",
            }}
          />
          <span>{users[rivalId].name}</span>
          <span className="text-text-4 font-mono">{fmt(rivalTotal)}</span>
        </div>
      </div>

      <LineChart
        a={meSeries}
        b={rivalSeries}
        width={640}
        height={170}
        colors={["#fafafa", "#737373"]}
      />

      <div className="flex justify-between pb-[6px] text-[10px] text-text-4 font-mono uppercase tracking-[0.6px]">
        {range === "7j" ? (
          ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
            <span key={d}>{d}</span>
          ))
        ) : range === "30j" ? (
          <>
            <span>il y a 30j</span>
            <span>21j</span>
            <span>14j</span>
            <span>7j</span>
            <span>auj.</span>
          </>
        ) : range === "3m" ? (
          <>
            <span>il y a 3m</span>
            <span>2m</span>
            <span>1m</span>
            <span>auj.</span>
          </>
        ) : (
          <>
            <span>il y a 1a</span>
            <span>6m</span>
            <span>3m</span>
            <span>auj.</span>
          </>
        )}
      </div>
    </div>
  );
}
