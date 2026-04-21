"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/primitives/Avatar";
import { fmt } from "@/lib/format";
import { formatRelativeDate, parseISODate } from "@/lib/date";
import { exportEntriesCSV } from "@/lib/export";
import { deleteEntry } from "@/lib/actions/entries";
import { EditEntryDialog } from "@/components/EditEntryDialog";
import type { TimeEntry } from "@/lib/types";

type UserFilter = "all" | string;
type ProjectFilter = "all" | string;
type RangeFilter = "all" | "7" | "30" | "90";

export function HistoryContent() {
  const entries = useStore((s) => s.entries);
  const users = useStore((s) => s.users);
  const projects = useStore((s) => s.projects);
  const currentUserId = useStore((s) => s.currentUserId);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const remove = (id: string) => startTransition(async () => { await deleteEntry(id); });

  const [userF, setUserF] = useState<UserFilter>("all");
  const [projectF, setProjectF] = useState<ProjectFilter>("all");
  const [rangeF, setRangeF] = useState<RangeFilter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeDays = rangeF === "all" ? null : parseInt(rangeF, 10);
    const qLower = q.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (userF !== "all" && e.userId !== userF) return false;
        if (projectF !== "all" && e.projectId !== projectF) return false;
        if (rangeDays) {
          const ageDays =
            (now - parseISODate(e.date).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays > rangeDays) return false;
        }
        if (qLower) {
          const proj = projects.find((p) => p.id === e.projectId);
          const hay = `${e.note} ${proj?.name ?? ""}`.toLowerCase();
          if (!hay.includes(qLower)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [entries, userF, projectF, rangeF, q, projects]);

  const total = filtered.reduce((s, e) => s + e.hours, 0);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
            Historique
          </div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            {filtered.length} entrée{filtered.length > 1 ? "s" : ""} ·{" "}
            <span className="font-mono text-text">{fmt(total)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => exportEntriesCSV(filtered, users, projects)}
          className="flex items-center gap-[6px] px-[10px] py-[6px] rounded-[5px] bg-transparent border border-border text-text-2 text-[11.5px] cursor-pointer hover:text-text hover:border-border-strong"
        >
          <Download size={12} strokeWidth={1.3} />
          Exporter
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md px-3 py-3 mb-[14px] flex flex-wrap gap-2 items-center">
        <select
          value={userF}
          onChange={(e) => setUserF(e.target.value as UserFilter)}
          className="px-2 py-[6px] rounded-[5px] bg-surface2 border border-border text-[12px] text-text outline-none"
        >
          <option value="all">Tous les membres</option>
          {Object.values(users).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={projectF}
          onChange={(e) => setProjectF(e.target.value as ProjectFilter)}
          className="px-2 py-[6px] rounded-[5px] bg-surface2 border border-border text-[12px] text-text outline-none"
        >
          <option value="all">Tous les projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={rangeF}
          onChange={(e) => setRangeF(e.target.value as RangeFilter)}
          className="px-2 py-[6px] rounded-[5px] bg-surface2 border border-border text-[12px] text-text outline-none"
        >
          <option value="all">Toute période</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher note ou projet…"
          className="flex-1 min-w-[180px] px-3 py-[6px] rounded-[5px] bg-surface2 border border-border text-[12px] text-text outline-none"
        />
        {(userF !== "all" || projectF !== "all" || rangeF !== "all" || q) && (
          <button
            type="button"
            onClick={() => {
              setUserF("all");
              setProjectF("all");
              setRangeF("all");
              setQ("");
            }}
            className="text-[11px] text-text-3 hover:text-text bg-transparent border-0 cursor-pointer"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {groups.length === 0 && (
        <div className="bg-surface border border-border rounded-md px-4 py-10 text-center text-[12px] text-text-3">
          Aucune entrée ne correspond aux filtres.
        </div>
      )}

      {groups.map(([date, list]) => {
        const dayTotal = list.reduce((s, e) => s + e.hours, 0);
        return (
          <div key={date} className="mb-4">
            <div className="flex items-center justify-between px-1 mb-[6px]">
              <div className="text-[11px] text-text-3 uppercase tracking-[0.6px] font-mono">
                {formatRelativeDate(date)}
              </div>
              <div className="text-[11px] text-text-3 font-mono">
                {fmt(dayTotal)} · {list.length}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              {list.map((e, i) => {
                const proj = projects.find((p) => p.id === e.projectId);
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
                      <div className="text-[12.5px] text-text truncate">
                        {proj?.name ?? e.projectId}
                        {e.category && (
                          <span className="text-text-3 ml-2">· {e.category}</span>
                        )}
                      </div>
                      {e.note && (
                        <div className="text-[11px] text-text-3 truncate">
                          {e.note}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-text-3 font-mono">
                      {new Date(e.createdAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-[13px] text-text min-w-[40px] text-right">
                        {fmt(e.hours)}
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
          </div>
        );
      })}
      <div className="h-10" />
      <EditEntryDialog entry={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
