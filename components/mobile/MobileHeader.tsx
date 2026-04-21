"use client";

import { Bell } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatShortHeaderDate } from "@/lib/date";
import { Avatar } from "@/components/primitives/Avatar";

export function MobileHeader() {
  const currentUser = useStore((s) => s.users[s.currentUserId]);
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
          aria-label="Notifications"
          className="w-[34px] h-[34px] rounded-full border border-border bg-surface grid place-items-center text-text-2"
        >
          <Bell size={16} strokeWidth={1.3} />
        </button>
        <Avatar userId={currentUser.id} size={34} />
      </div>
    </div>
  );
}
