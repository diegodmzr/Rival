"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { Avatar } from "@/components/primitives/Avatar";
import { LineChart } from "@/components/primitives/LineChart";
import { dailySeries } from "@/lib/compute";
import { fmt, fmtExact, fmtParts } from "@/lib/format";
import { formatRelativeDate } from "@/lib/date";
import { deleteEntry } from "@/lib/actions/entries";
import { EditEntryDialog } from "@/components/EditEntryDialog";
import type { TimeEntry } from "@/lib/types";

export function ProjectDetailContent({ id }: { id: string }) {
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const entries = useStore((s) => s.entries);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const remove = (entryId: string) => startTransition(async () => { await deleteEntry(entryId); });

  if (!project) {
    return (
      <div className="p-6">
        <Link href="/projects" className="text-[12px] text-text-3 hover:text-text">
          ← Retour aux projets
        </Link>
        <div className="mt-6 text-[14px] text-text-2">Projet introuvable.</div>
      </div>
    );
  }

  const projectEntries = entries
    .filter((e) => e.projectId === id)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

  const myHours = projectEntries
    .filter((e) => e.userId === me.id)
    .reduce((s, e) => s + e.hours, 0);
  const rivalHours = projectEntries
    .filter((e) => e.userId === rival.id)
    .reduce((s, e) => s + e.hours, 0);
  const total = projectEntries.reduce((s, e) => s + e.hours, 0);

  // Daily series across all users on this project for 30 days
  const seriesMine = dailySeries(
    entries.filter((e) => e.projectId === id),
    me.id,
    30,
  );
  const seriesRival = dailySeries(
    entries.filter((e) => e.projectId === id),
    rival.id,
    30,
  );

  return (
    <div className="p-5 md:p-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-[6px] text-[12px] text-text-3 hover:text-text mb-3"
      >
        <ArrowLeft size={12} strokeWidth={1.3} /> Projets
      </Link>

      <div className="mb-4">
        <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
          {project.name}
        </div>
        <div className="text-[11.5px] text-text-3 mt-[2px]">
          Créé le{" "}
          <span className="font-mono">
            {new Date(project.createdAt).toLocaleDateString("fr-FR")}
          </span>{" "}
          · {projectEntries.length} entrée{projectEntries.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[10px] md:gap-[14px] mb-[14px]">
        {[
          { label: "Toi", v: myHours, id: me.id },
          { label: rival.name, v: rivalHours, id: rival.id },
          { label: "Total", v: total, id: null },
        ].map((c) => {
          const parts = fmtParts(c.v);
          return (
            <div
              key={c.label}
              className="bg-surface border border-border rounded-md px-[14px] py-[12px] flex flex-col gap-1"
            >
              <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono flex items-center gap-2">
                {c.id && <Avatar userId={c.id} size={14} />}
                {c.label}
              </div>
              <div className="font-mono text-[22px] text-text font-medium tracking-[-0.4px]">
                {parts.main}
                <span className="text-[13px] text-text-3 ml-[2px]">{parts.suffix}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface border border-border rounded-md px-[18px] py-4 mb-[14px]">
        <div className="text-[13px] text-text font-medium mb-3">30 derniers jours</div>
        <LineChart
          a={seriesMine}
          b={seriesRival}
          width={720}
          height={160}
          colors={["#fafafa", "#737373"]}
        />
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <div className="px-[18px] py-3 border-b border-border text-[13px] text-text font-medium">
          Toutes les entrées
        </div>
        {projectEntries.length === 0 && (
          <div className="px-4 py-8 text-[12px] text-text-3 text-center">
            Aucune entrée pour ce projet.
          </div>
        )}
        {projectEntries.map((e, i) => {
          const mine = e.userId === currentUserId;
          return (
            <div
              key={e.id}
              className={`group grid grid-cols-[20px_1fr_auto_auto] items-center gap-3 px-4 py-[10px] ${
                i === 0 ? "" : "border-t border-border"
              }`}
            >
              <Avatar userId={e.userId} size={18} active={mine} />
              <div className="min-w-0">
                <div className="text-[12.5px] text-text">
                  {users[e.userId]?.name ?? e.userId}
                </div>
                {e.note && (
                  <div className="text-[11px] text-text-3 truncate">{e.note}</div>
                )}
              </div>
              <div className="text-[11px] text-text-3 font-mono">
                {formatRelativeDate(e.date, e.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-[13px] text-text min-w-[40px] text-right">
                  {fmtExact(e.hours)}
                </div>
                {mine ? (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setEditing(e)}
                      aria-label="Modifier l'entrée"
                      className="text-text-4 hover:text-text-2 bg-transparent border-0 cursor-pointer"
                    >
                      <Pencil size={12} strokeWidth={1.3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      disabled={pending}
                      aria-label="Supprimer l'entrée"
                      className="text-text-4 hover:text-text-2 bg-transparent border-0 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 size={12} strokeWidth={1.3} />
                    </button>
                  </div>
                ) : (
                  <div className="w-[28px]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-10" />
      <EditEntryDialog entry={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
