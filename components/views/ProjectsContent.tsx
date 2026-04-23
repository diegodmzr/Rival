"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil, Check, X, ChevronRight } from "lucide-react";
import { useStore, selectCurrentUser, selectRivalUser } from "@/lib/store";
import { projectBreakdown } from "@/lib/compute";
import { fmt } from "@/lib/format";
import { addProject, renameProject, deleteProject } from "@/lib/actions/projects";

export function ProjectsContent() {
  const projects = useStore((s) => s.projects);
  const entries = useStore((s) => s.entries);
  const me = useStore(selectCurrentUser);
  const rival = useStore(selectRivalUser);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const breakdownAll = projectBreakdown(entries, 365, [me.id, rival.id]);
  const breakdown30 = projectBreakdown(entries, 30, [me.id, rival.id]);

  const items = projects
    .map((p) => ({
      project: p,
      allTime: breakdownAll[p.id]?.total ?? 0,
      month: breakdown30[p.id]?.total ?? 0,
      byUser: breakdownAll[p.id]?.hours ?? { [me.id]: 0, [rival.id]: 0 },
    }))
    // Keep the personal project pinned at the bottom, regular ones sorted by total hours.
    .sort((a, b) => {
      if (a.project.isPersonal !== b.project.isPersonal) {
        return a.project.isPersonal ? 1 : -1;
      }
      return b.allTime - a.allTime;
    });

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await addProject(name);
      if (!res.ok) {
        showError(res.error ?? "Impossible de créer.");
        return;
      }
      setNewName("");
    });
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) {
      setEditingId(null);
      return;
    }
    const id = editingId;
    const name = editName.trim();
    startTransition(async () => {
      const res = await renameProject(id, name);
      if (!res.ok) showError(res.error ?? "Impossible de renommer.");
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteProject(id);
      if (!res.ok) showError(res.error ?? "Impossible de supprimer.");
    });
  };

  return (
    <div className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[18px] md:text-[22px] text-text font-medium tracking-[-0.4px]">
            Projets
          </div>
          <div className="text-[11.5px] text-text-3 mt-[2px]">
            {projects.length} projet{projects.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="flex gap-2 items-center bg-surface border border-border rounded-md px-3 py-[10px] mb-[14px]"
      >
        <Plus size={14} strokeWidth={1.3} className="text-text-3" />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom du nouveau projet…"
          className="flex-1 bg-transparent text-[13px] text-text outline-none"
        />
        <button
          type="submit"
          disabled={!newName.trim() || pending}
          className="px-3 py-[6px] rounded-[5px] bg-text text-[#050505] text-[12px] font-medium border-0 cursor-pointer disabled:opacity-40"
        >
          {pending ? "…" : "Créer"}
        </button>
      </form>

      {error && (
        <div className="mb-3 px-3 py-2 bg-surface border border-border rounded-md text-[12px] text-text-2">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {items.length === 0 && (
          <div className="px-4 py-8 text-[12px] text-text-3 text-center">
            Aucun projet pour le moment.
          </div>
        )}
        {items.map(({ project, allTime, month, byUser }, i) => {
          const editing = editingId === project.id;
          return (
            <div
              key={project.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 ${
                i === 0 ? "" : "border-t border-border"
              }`}
            >
              <div className="min-w-0">
                {editing ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="bg-surface2 border border-border text-[13px] text-text px-2 py-1 rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="text-text-2 hover:text-text bg-transparent border-0 cursor-pointer"
                    >
                      <Check size={14} strokeWidth={1.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-text-3 hover:text-text-2 bg-transparent border-0 cursor-pointer"
                    >
                      <X size={14} strokeWidth={1.4} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-2 min-w-0 group"
                  >
                    <span className="text-[13px] text-text font-medium truncate group-hover:underline">
                      {project.name}
                    </span>
                    {project.isPersonal && (
                      <span className="text-[9.5px] text-text-3 uppercase tracking-[0.6px] font-mono px-[6px] py-[2px] rounded-[3px] bg-white/[0.04] border border-border">
                        Perso
                      </span>
                    )}
                    <ChevronRight
                      size={12}
                      strokeWidth={1.3}
                      className="text-text-4 group-hover:text-text-2 flex-shrink-0"
                    />
                  </Link>
                )}
                <div className="text-[10.5px] text-text-3 font-mono mt-[2px] flex gap-3">
                  <span>
                    Toi <span className="text-text-2">{fmt(byUser[me.id] ?? 0)}</span>
                  </span>
                  <span>
                    {rival.name}{" "}
                    <span className="text-text-2">{fmt(byUser[rival.id] ?? 0)}</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-4 font-mono uppercase tracking-[0.6px]">
                  30j
                </div>
                <div className="font-mono text-[13px] text-text">{fmt(month)}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-4 font-mono uppercase tracking-[0.6px]">
                  Total
                </div>
                <div className="font-mono text-[13px] text-text">{fmt(allTime)}</div>
              </div>
              {!editing && !project.isPersonal && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(project.id, project.name)}
                    aria-label="Renommer"
                    className="w-[28px] h-[28px] grid place-items-center rounded-[5px] text-text-3 hover:text-text hover:bg-white/[0.04] bg-transparent border-0 cursor-pointer"
                  >
                    <Pencil size={12} strokeWidth={1.3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    aria-label="Supprimer"
                    className="w-[28px] h-[28px] grid place-items-center rounded-[5px] text-text-3 hover:text-text hover:bg-white/[0.04] bg-transparent border-0 cursor-pointer"
                  >
                    <Trash2 size={12} strokeWidth={1.3} />
                  </button>
                </div>
              )}
              {!editing && project.isPersonal && <div />}
            </div>
          );
        })}
      </div>
      <div className="h-10" />
    </div>
  );
}
