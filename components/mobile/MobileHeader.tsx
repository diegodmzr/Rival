"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatShortHeaderDate } from "@/lib/date";
import { Avatar } from "@/components/primitives/Avatar";

export function MobileHeader() {
  const currentUser = useStore((s) => s.users[s.currentUserId]);
  const timerRunning = useStore((s) => s.timer.running);
  const openMobileTimer = useStore((s) => s.openMobileTimer);
  const hr = new Date().getHours();
  const hello = hr < 12 ? "Bonjour" : hr < 18 ? "Bon après-midi" : "Bonsoir";
  return (
    <div className="px-5 pt-2 pb-[14px] flex items-center justify-between">
      <div>
        <div className="text-[10.5px] text-text-3 font-mono uppercase tracking-[0.8px]">
          {formatShortHeaderDate()}
        </div>
        <div className="text-[22px] text-text font-medium tracking-[-0.4px] mt-[2px]">
          {hello}, {currentUser.name}.
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          aria-label="Chrono"
          onClick={openMobileTimer}
          className={`relative w-[34px] h-[34px] rounded-full border grid place-items-center ${
            timerRunning
              ? "border-text-2 bg-white/[0.06] text-text"
              : "border-border bg-surface text-text-2"
          }`}
        >
          <Play size={14} strokeWidth={1.4} />
          {timerRunning && (
            <span
              className="absolute top-[2px] right-[2px] w-[7px] h-[7px] rounded-full bg-text animate-pulse"
              style={{ boxShadow: "0 0 0 2px rgba(5,5,5,1)" }}
            />
          )}
        </button>
        <Link href="/settings" aria-label="Paramètres" className="block">
          <Avatar userId={currentUser.id} size={34} />
        </Link>
      </div>
    </div>
  );
}
