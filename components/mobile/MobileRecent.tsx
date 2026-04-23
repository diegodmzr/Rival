"use client";

import Link from "next/link";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { fmt } from "@/lib/format";
import { formatRelativeDate } from "@/lib/date";

export function MobileRecent() {
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);
  const currentUserId = useStore((s) => s.currentUserId);

  const sorted = [...entries]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 4);

  return (
    <div className="mx-4 mb-[100px]">
      <div className="flex justify-between items-center px-1 pt-1 pb-[10px]">
        <div className="text-[12.5px] text-text font-medium">Entrées récentes</div>
        <Link href="/history" className="text-[11px] text-text-3 cursor-pointer">
          Tout voir
        </Link>
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {sorted.length === 0 && (
          <div className="px-3 py-6 text-[12px] text-text-3">0 entrée. Le game commence pas tout seul.</div>
        )}
        {sorted.map((e, i) => {
          const proj = projects.find((p) => p.id === e.projectId);
          return (
            <div
              key={e.id}
              className={`grid grid-cols-[20px_1fr_auto] gap-[10px] px-3 py-[10px] items-center ${
                i === 0 ? "" : "border-t border-border"
              }`}
            >
              <Avatar userId={e.userId} size={18} active={e.userId === currentUserId} />
              <div className="min-w-0">
                <div className="text-[12px] text-text whitespace-nowrap overflow-hidden text-ellipsis">
                  {proj?.name.replace("My Folio — ", "") ?? e.projectId}
                  {e.category && (
                    <span className="text-text-3 ml-[6px]">· {e.category}</span>
                  )}
                </div>
                <div className="text-[10px] text-text-3 font-mono mt-px">
                  {formatRelativeDate(e.date, e.createdAt)}
                </div>
              </div>
              <div className="font-mono text-[12.5px] text-text">{fmt(e.hours)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
