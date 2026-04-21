"use client";

import { Flame, Target, Trophy, TrendingUp, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeBadges } from "@/lib/compute";

function iconFor(id: string): LucideIcon {
  if (id.includes("streak")) return Flame;
  if (id.includes("month")) return Target;
  if (id.includes("first")) return Trophy;
  if (id.includes("marathon")) return TrendingUp;
  return Sparkles;
}

export function BadgesCard() {
  const entries = useStore((s) => s.entries);
  const currentUser = useStore((s) => s.users[s.currentUserId]);
  const currentUserId = useStore((s) => s.currentUserId);
  const badges = computeBadges(entries, currentUserId, currentUser.monthlyGoal);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <div className="bg-surface border border-border rounded-md px-[18px] py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-text font-medium">Badges</div>
        <div className="text-[11px] text-text-3 font-mono">
          {earned} / {badges.length}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-[10px]">
        {badges.map((b) => {
          const Icon = iconFor(b.id);
          return (
            <div
              key={b.id}
              className={`border border-border rounded-[5px] px-[10px] py-[10px] flex flex-col gap-[6px] min-h-[62px] ${
                b.earned ? "bg-white/[0.03] opacity-100" : "bg-transparent opacity-[0.55]"
              }`}
              title={b.label}
            >
              <div className={b.earned ? "text-text" : "text-text-3"}>
                <Icon size={13} strokeWidth={1.3} />
              </div>
              <div
                className={`text-[10.5px] leading-[1.3] ${
                  b.earned ? "text-text" : "text-text-3"
                }`}
              >
                {b.label}
              </div>
              {b.progress !== undefined && !b.earned && (
                <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, b.progress * 100)}%`,
                      background: "rgba(250,250,250,0.4)",
                    }}
                  />
                </div>
              )}
              {b.earned && b.when && (
                <div className="text-[9.5px] text-text-4 font-mono">{b.when}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
