"use client";

import { useState } from "react";
import { LineChart } from "@/components/primitives/LineChart";
import { Heatmap } from "@/components/primitives/Heatmap";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import {
  dailySeries,
  heatmapCells,
  todayHours,
  weekHours,
  monthHours,
  streakDays,
  longestStreak,
  bestDay,
  projectBreakdown,
} from "@/lib/compute";
import { fmt, fmtMetric } from "@/lib/format";

type Range = "7j" | "30j" | "90j" | "1a";
const RANGES: Range[] = ["7j", "30j", "90j", "1a"];
const DAYS_FOR: Record<Range, number> = { "7j": 7, "30j": 30, "90j": 90, "1a": 365 };

export function StatsContent() {
  const [range, setRange] = useState<Range>("30j");
  const n = DAYS_FOR[range];
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const mySeries = dailySeries(entries, me.id, n);
  const rivalSeries = dailySeries(entries, rival.id, n);
  const myTotal = mySeries.reduce((a, b) => a + b, 0);
  const rivalTotal = rivalSeries.reduce((a, b) => a + b, 0);
  const diff = myTotal - rivalTotal;
  const avg = myTotal / Math.max(n, 1);

  const record = longestStreak(entries, me.id);
  const streak = streakDays(entries, me.id);
  const best = bestDay(entries, me.id);
  const heat = heatmapCells(entries, me.id, 91);

  const breakdown = projectBreakdown(entries, n, [me.id, rival.id]);
  const items = projects
    .map((p) => ({
      project: p,
      stat:
        breakdown[p.id] ?? {
          projectId: p.id,
          hours: { [me.id]: 0, [rival.id]: 0 },
          total: 0,
        },
    }))
    .sort((a, b) => b.stat.total - a.stat.total);
  const maxProj = Math.max(...items.map((x) => x.stat.total), 0.01);

  const stats = [
    { label: "Aujourd'hui", v: todayHours(entries, me.id), suffix: "h" },
    { label: "Semaine", v: weekHours(entries, me.id), suffix: "h" },
    { label: "Mois", v: monthHours(entries, me.id), suffix: "h" },
    { label: "Total période", v: myTotal, suffix: "h" },
    { label: "Moy./jour", v: avg, suffix: "h" },
    { label: "Streak", v: streak, suffix: "j", mono: true },
    { label: "Record", v: record, suffix: "j", mono: true },
    { label: "Meilleur jour", v: best.hours, suffix: "h" },
  ];

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
            Statistiques
          </div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            Période ·{" "}
            {range === "1a" ? "12 mois" : range === "90j" ? "3 mois" : `${n} jours`}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] md:gap-[14px] mb-[14px]">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-md px-[14px] py-[14px] flex flex-col gap-2"
          >
            <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono">
              {s.label}
            </div>
            <div className="font-mono text-[24px] text-text font-medium tracking-[-0.4px]">
              {s.mono ? s.v : fmtMetric(s.v)}
              <span className="text-[13px] text-text-3 ml-[2px]">{s.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] text-text font-medium">Heures quotidiennes</div>
            <div className="text-[11.5px] text-text-3 mt-[2px]">
              Toi vs {rival.name} · écart{" "}
              <span className="font-mono text-text">
                {diff >= 0 ? "+" : "−"}
                {fmt(Math.abs(diff))}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-[11px]">
            <div className="flex items-center gap-[6px] text-text-2">
              <div className="w-[14px] h-[2px] bg-text" />
              <span>Toi</span>
              <span className="text-text-4 font-mono">{fmt(myTotal)}</span>
            </div>
            <div className="flex items-center gap-[6px] text-text-2">
              <div
                className="w-[14px] h-[2px]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #737373 0 3px, transparent 3px 6px)",
                }}
              />
              <span>{rival.name}</span>
              <span className="text-text-4 font-mono">{fmt(rivalTotal)}</span>
            </div>
          </div>
        </div>
        <LineChart
          a={mySeries}
          b={rivalSeries}
          width={720}
          height={200}
          colors={["#fafafa", "#737373"]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-[14px]">
        <div className="bg-surface border border-border rounded-md px-[18px] py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] text-text font-medium">Activité · 13 semaines</div>
            <div className="text-[11px] text-text-3 font-mono">
              streak {streak}j · record {record}j
            </div>
          </div>
          <Heatmap days={heat} cell={12} gap={3} />
        </div>
        <div className="bg-surface border border-border rounded-md px-[18px] py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] text-text font-medium">Projets</div>
            <div className="text-[11px] text-text-3 font-mono">
              sur {n}j
            </div>
          </div>
          <div className="flex flex-col gap-[10px]">
            {items.map(({ project, stat }) => (
              <div key={project.id}>
                <div className="flex justify-between text-[12px] mb-[5px]">
                  <span className="text-text-2 truncate pr-2">{project.name}</span>
                  <span className="font-mono text-text-3">
                    {fmt(stat.total)}
                  </span>
                </div>
                <div className="flex h-1 rounded-[2px] overflow-hidden bg-white/[0.04]">
                  <div
                    className="bg-text transition-[width] duration-300"
                    style={{
                      width: `${((stat.hours[me.id] ?? 0) / maxProj) * 100}%`,
                    }}
                  />
                  <div
                    className="transition-[width] duration-300"
                    style={{
                      width: `${((stat.hours[rival.id] ?? 0) / maxProj) * 100}%`,
                      background: "rgba(250,250,250,0.30)",
                    }}
                  />
                </div>
              </div>
            ))}
            {items.every((x) => x.stat.total === 0) && (
              <div className="text-[11px] text-text-4 py-3">
                Aucune entrée sur {n} jours.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}
