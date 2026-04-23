"use client";

import Link from "next/link";
import { NotebookPen, ChevronRight } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { todayISO } from "@/lib/date";

export function RecapPromptCard() {
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);
  const recaps = useStore((s) => s.recaps);
  const today = todayISO();

  const myRecap = recaps.find((r) => r.userId === me.id && r.date === today);
  const rivalRecap =
    rival && rival.id !== me.id
      ? recaps.find((r) => r.userId === rival.id && r.date === today)
      : null;

  const myNote = myRecap?.note?.trim() ?? "";
  const rivalNote = rivalRecap?.note?.trim() ?? "";

  if (!myNote && !rivalNote) {
    return (
      <Link
        href="/recap"
        className="mb-[14px] flex items-center gap-3 px-4 py-[10px] bg-surface border border-border rounded-md text-text-2 hover:text-text hover:border-border-strong transition-colors"
      >
        <NotebookPen size={14} strokeWidth={1.3} className="text-text-3" />
        <div className="text-[12.5px]">
          Qu&apos;as-tu fait aujourd&apos;hui ?
        </div>
        <div className="flex-1" />
        <div className="text-[10.5px] text-text-3 font-mono uppercase tracking-[0.6px]">
          recap du jour
        </div>
        <ChevronRight size={14} strokeWidth={1.3} className="text-text-3" />
      </Link>
    );
  }

  return (
    <Link
      href="/recap"
      className="mb-[14px] block bg-surface border border-border rounded-md hover:border-border-strong transition-colors"
    >
      <div className="flex items-center justify-between px-4 py-[10px] border-b border-border">
        <div className="flex items-center gap-2">
          <NotebookPen size={13} strokeWidth={1.3} className="text-text-3" />
          <div className="text-[11px] text-text-3 uppercase tracking-[0.6px] font-mono">
            Recap du jour
          </div>
        </div>
        <ChevronRight size={14} strokeWidth={1.3} className="text-text-3" />
      </div>
      <div className="px-4 py-[10px] grid md:grid-cols-2 gap-3">
        <RecapSnippet label={me.name} note={myNote} empty="À écrire." own />
        {rival && rival.id !== me.id && (
          <RecapSnippet
            label={rival.name}
            note={rivalNote}
            empty="Rien pour l'instant."
          />
        )}
      </div>
    </Link>
  );
}

function RecapSnippet({
  label,
  note,
  empty,
  own = false,
}: {
  label: string;
  note: string;
  empty: string;
  own?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-[10.5px] uppercase tracking-[0.6px] font-mono mb-[4px] ${
          own ? "text-text-2" : "text-text-3"
        }`}
      >
        {label}
      </div>
      {note ? (
        <div className="text-[12px] text-text-2 leading-[1.5] line-clamp-3 whitespace-pre-wrap">
          {note}
        </div>
      ) : (
        <div className="text-[12px] text-text-4 italic">{empty}</div>
      )}
    </div>
  );
}
