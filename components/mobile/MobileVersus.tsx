"use client";

import { Avatar } from "@/components/primitives/Avatar";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { weekHours } from "@/lib/compute";
import { weekNumber } from "@/lib/date";
import { fmt, pct } from "@/lib/format";

export function MobileVersus() {
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const mine = weekHours(entries, me.id);
  const theirs = weekHours(entries, rival.id);
  const max = Math.max(mine, theirs, 0.01);
  const rows = [me, rival];
  const week = weekNumber();

  return (
    <div className="mx-4 mb-[14px] px-4 py-[14px] bg-surface border border-border rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[11px] text-text-3 uppercase tracking-[0.6px] font-mono">
          Toi vs {rival.name} · semaine
        </div>
        <div className="text-[10px] text-text-4 font-mono">S{week}</div>
      </div>
      <div className="flex flex-col gap-[10px]">
        {rows.map((u) => {
          const isMe = u.id === me.id;
          const v = isMe ? mine : theirs;
          return (
            <div key={u.id} className="flex items-center gap-[10px]">
              <Avatar userId={u.id} size={20} active={isMe} />
              <div className="flex-1">
                <div className="h-[6px] bg-white/[0.04] rounded-[2px] overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(v / max) * 100}%`,
                      background: isMe ? "#fafafa" : "rgba(250,250,250,0.35)",
                      transition: "width 500ms",
                    }}
                  />
                </div>
              </div>
              <div
                className={`w-[54px] text-right font-mono text-[12.5px] ${
                  isMe ? "text-text" : "text-text-2"
                }`}
              >
                {fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-[10px] border-t border-border flex justify-between text-[11px] text-text-3">
        <span>
          Écart <span className="font-mono text-text">{fmt(Math.abs(mine - theirs))}</span>
        </span>
        <span>
          Objectif{" "}
          <span className="font-mono text-text-2">
            {me.weeklyGoal > 0 ? pct(mine / me.weeklyGoal) : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}
