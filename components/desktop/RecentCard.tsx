"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { useStore } from "@/lib/store";
import { fmtExact } from "@/lib/format";
import { formatRelativeDate } from "@/lib/date";
import { deleteEntry } from "@/lib/actions/entries";
import { EditEntryDialog } from "@/components/EditEntryDialog";
import type { TimeEntry } from "@/lib/types";

export function RecentCard() {
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);
  const currentUserId = useStore((s) => s.currentUserId);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const remove = (id: string) => startTransition(async () => { await deleteEntry(id); });

  const sorted = [...entries]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 6);

  return (
    <>
      <div className="bg-surface border border-border rounded-md pt-4 pb-1 flex flex-col">
        <div className="flex items-center justify-between px-[18px] pb-3">
          <div className="text-[13px] text-text font-medium">Entrées récentes</div>
          <Link
            href="/history"
            className="text-[11px] text-text-3 cursor-pointer hover:text-text"
          >
            Voir tout
          </Link>
        </div>
        <div>
          {sorted.length === 0 && (
            <div className="px-[18px] py-6 text-[12px] text-text-3 border-t border-border">
              0 entrée. Le game commence pas tout seul.
            </div>
          )}
          {sorted.map((e, i) => {
            const proj = projects.find((p) => p.id === e.projectId);
            const mine = e.userId === currentUserId;
            return (
              <div
                key={e.id}
                className={`group grid grid-cols-[22px_1fr_auto_auto] gap-3 items-center px-[18px] py-[9px] border-b border-border ${
                  i === 0 ? "border-t" : ""
                }`}
              >
                <Avatar userId={e.userId} size={20} active={mine} />
                <div className="min-w-0">
                  <div className="text-[12.5px] text-text flex gap-2 items-baseline flex-wrap">
                    <span>{proj?.name ?? e.projectId}</span>
                    {e.category && (
                      <>
                        <span className="text-text-4 text-[11px]">·</span>
                        <span className="text-text-3 text-[11px]">{e.category}</span>
                      </>
                    )}
                    <span className="text-text-4 text-[11px]">·</span>
                    <span className="text-text-3 font-mono text-[11px]">
                      {formatRelativeDate(e.date, e.createdAt)}
                    </span>
                  </div>
                  {e.note && (
                    <div className="text-[11.5px] text-text-3 mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {e.note}
                    </div>
                  )}
                </div>
                <div className="font-mono text-[13px] text-text">{fmtExact(e.hours)}</div>
                {mine ? (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setEditing(e)}
                      aria-label="Modifier l'entrée"
                      className="text-text-4 hover:text-text-2"
                    >
                      <Pencil size={12} strokeWidth={1.3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      disabled={pending}
                      aria-label="Supprimer l'entrée"
                      className="text-text-4 hover:text-text-2 disabled:opacity-40"
                    >
                      <Trash2 size={12} strokeWidth={1.3} />
                    </button>
                  </div>
                ) : (
                  <div className="w-[28px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <EditEntryDialog entry={editing} onClose={() => setEditing(null)} />
    </>
  );
}
