"use client";

import { Trophy } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { weekHours } from "@/lib/compute";
import { fmt, pct } from "@/lib/format";
import { versusLabel } from "@/lib/homeCopy";

export function VersusCard() {
  const entries = useStore((s) => s.entries);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const rivalId = Object.keys(users).find((i) => i !== currentUserId) ?? currentUserId;

  const meWeek = weekHours(entries, currentUserId);
  const rivalWeek = weekHours(entries, rivalId);
  const diff = meWeek - rivalWeek;
  const max = Math.max(meWeek, rivalWeek, 0.01);
  const rows = [currentUserId, rivalId];
  const goal = users[currentUserId].weeklyGoal;
  const label = versusLabel({ diff, rivalName: users[rivalId]?.name ?? "" });

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-[14px] col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <div className="text-[11.5px] text-text-3 uppercase tracking-[0.6px]">
            Tu vs {users[rivalId].name}
          </div>
          <div className="text-[10.5px] text-text-4 font-mono">CETTE SEMAINE</div>
        </div>
        <div className="flex items-center gap-[6px] text-[11px] text-text-2 font-mono">
          <Trophy size={12} strokeWidth={1.3} />
          <span>{label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {rows.map((u) => {
          const v = u === currentUserId ? meWeek : rivalWeek;
          const isMe = u === currentUserId;
          return (
            <div key={u} className="flex items-center gap-3">
              <div
                className={`w-16 text-[12px] flex items-center gap-[6px] ${
                  isMe ? "text-text" : "text-text-2"
                }`}
              >
                <Avatar userId={u} size={18} active={isMe} />
                <span>{isMe ? "Toi" : users[u].name}</span>
              </div>
              <div className="flex-1 h-2 bg-white/[0.04] rounded-[2px] overflow-hidden relative">
                <div
                  className="h-full rounded-[2px]"
                  style={{
                    width: `${(v / max) * 100}%`,
                    background: isMe ? "#fafafa" : "rgba(250,250,250,0.35)",
                    transition: "width 600ms cubic-bezier(.2,.8,.2,1)",
                  }}
                />
              </div>
              <div
                className={`w-[70px] text-right font-mono text-[13px] ${
                  isMe ? "text-text" : "text-text-2"
                }`}
              >
                {fmt(v)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-[14px] pt-[10px] border-t border-border text-[11.5px] text-text-3">
        <span>
          Écart <span className="font-mono text-text">{fmt(Math.abs(diff))}</span>
          <span className="ml-[6px]">({pct(Math.abs(diff) / max)})</span>
        </span>
        <span className="text-text-4">·</span>
        <span>
          Objectif hebdo{" "}
          <span className="font-mono text-text-2">{goal}h</span>
        </span>
        <span className="ml-auto font-mono text-text-2">
          {pct(meWeek / goal)} atteint
        </span>
      </div>
    </div>
  );
}
