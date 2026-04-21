"use client";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { UserId } from "@/lib/types";

interface AvatarProps {
  userId: UserId;
  size?: number;
  active?: boolean;
  className?: string;
}

export function Avatar({ userId, size = 22, active = false, className }: AvatarProps) {
  const user = useStore((s) => s.users[userId]);
  const initials = user?.initials ?? "?";
  return (
    <div
      className={cn(
        "rounded-full grid place-items-center flex-shrink-0 font-semibold select-none",
        active
          ? "bg-text text-[#0a0a0a] border-0"
          : "bg-white/[0.08] text-[rgba(250,250,250,0.85)] border border-border",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        letterSpacing: 0,
      }}
    >
      {initials}
    </div>
  );
}
