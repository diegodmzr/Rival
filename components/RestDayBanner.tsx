"use client";

import { Moon } from "lucide-react";
import { useStore, selectCurrentUser } from "@/lib/store";
import { todayISO } from "@/lib/date";
import { fmt } from "@/lib/format";

export function RestDayBanner() {
  const me = useStore(selectCurrentUser);
  const entries = useStore((s) => s.entries);

  if (!me) return null;
  const weekday = me.restDayWeekday;
  if (weekday === null || weekday === undefined) return null;
  const today = todayISO();
  if (new Date().getDay() !== weekday) return null;

  const max = Number(me.restDayMaxHours ?? 0);
  if (max <= 0) return null;

  const logged = entries
    .filter((e) => e.userId === me.id && e.date === today)
    .reduce((s, e) => s + e.hours, 0);
  const remaining = Math.max(0, max - logged);
  const reached = logged >= max;

  return (
    <div
      className={`flex items-center gap-[10px] px-[14px] py-[10px] rounded-md border mb-[14px] ${
        reached
          ? "bg-white/[0.04] border-border-strong"
          : "bg-surface border-border"
      }`}
    >
      <Moon size={14} strokeWidth={1.3} className="text-text-2" />
      <div className="text-[12.5px] text-text leading-[1.35] flex-1">
        {reached ? (
          <>Jour de repos — quota atteint. Repose-toi vraiment.</>
        ) : (
          <>
            Jour de repos — il te reste{" "}
            <span className="font-mono">{fmt(remaining)}</span> sur{" "}
            <span className="font-mono">{fmt(max)}</span>.
          </>
        )}
      </div>
    </div>
  );
}
