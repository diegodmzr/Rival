"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Minus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmt, fmtMetric } from "@/lib/format";
import { todayISO } from "@/lib/date";
import { updateEntry } from "@/lib/actions/entries";
import type { TimeEntry } from "@/lib/types";

const PRESETS = [0.5, 1, 1.5, 2, 4, 8];

export function EditEntryDialog({
  entry,
  onClose,
}: {
  entry: TimeEntry | null;
  onClose: () => void;
}) {
  const projects = useStore((s) => s.projects);

  const [h, setH] = useState(0);
  const [projectId, setProjectId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!entry) return;
    setH(entry.hours);
    setProjectId(entry.projectId);
    setNote(entry.note);
    setDate(entry.date);
    setError(null);
  }, [entry]);

  if (!entry) return null;

  const inc = (d: number) => setH((v) => Math.max(0, Math.round((v + d) * 4) / 4));

  const submit = () => {
    if (h <= 0 || !projectId) return;
    setError(null);
    startTransition(async () => {
      const res = await updateEntry(entry.id, {
        hours: h,
        projectId,
        date,
        note,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de la mise à jour.");
        return;
      }
      onClose();
    });
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[90] animate-fadeIn"
      />
      <div className="fixed left-0 right-0 bottom-0 md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] md:rounded-2xl bg-surface border border-border-strong rounded-t-2xl px-[18px] pt-2 pb-7 z-[91] animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-[6px] mb-[14px] md:hidden" />
        <div className="flex items-center justify-between mb-[14px]">
          <div className="text-[15px] text-text font-medium">Modifier l&apos;entrée</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-3 cursor-pointer bg-transparent border-0 p-1"
          >
            <X size={18} strokeWidth={1.3} />
          </button>
        </div>

        <div className="flex items-center justify-between px-3 py-[14px] bg-surface2 border border-border rounded-[10px] mb-3">
          <button
            type="button"
            onClick={() => inc(-0.25)}
            aria-label="Moins 15 minutes"
            className="w-[46px] h-[46px] rounded-full bg-surface border border-border text-text grid place-items-center cursor-pointer"
          >
            <Minus size={18} strokeWidth={1.4} />
          </button>
          <div className="text-center">
            <div className="font-mono text-[40px] text-text font-medium tracking-[-0.8px] leading-none">
              {fmtMetric(h)}
              <span className="text-[18px] text-text-3 ml-[2px]">h</span>
            </div>
            <div className="text-[10.5px] text-text-4 font-mono mt-1 uppercase tracking-[0.8px]">
              par pas de 15 min
            </div>
          </div>
          <button
            type="button"
            onClick={() => inc(0.25)}
            aria-label="Plus 15 minutes"
            className="w-[46px] h-[46px] rounded-full bg-surface border border-border text-text grid place-items-center cursor-pointer"
          >
            <Plus size={18} strokeWidth={1.4} />
          </button>
        </div>

        <div className="flex gap-[6px] mb-[14px]">
          {PRESETS.map((v) => {
            const active = Math.abs(h - v) < 0.01;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setH(v)}
                className={`flex-1 py-2 rounded-md font-mono text-[11.5px] cursor-pointer border ${
                  active
                    ? "bg-white/[0.08] border-border-strong text-text"
                    : "bg-surface2 border-border text-text-2"
                }`}
              >
                {v}h
              </button>
            );
          })}
        </div>

        <div className="mb-3">
          <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
            Projet
          </div>
          <div className="flex gap-[6px] flex-wrap">
            {projects.map((p) => {
              const active = p.id === projectId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProjectId(p.id)}
                  className={`px-3 py-[7px] rounded-md text-[11.5px] cursor-pointer border ${
                    active
                      ? "bg-white/[0.08] border-border-strong text-text"
                      : "bg-surface2 border-border text-text-2"
                  }`}
                >
                  {p.name.replace("My Folio — ", "")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3 flex gap-2 items-center">
          <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono w-[50px]">
            Date
          </div>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-3 py-[9px] rounded-lg bg-surface2 border border-border text-text text-[12.5px] outline-none font-mono"
          />
        </div>

        <div className="mb-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note optionnelle…"
            className="w-full px-3 py-[11px] rounded-lg bg-surface2 border border-border text-text text-[13px] outline-none"
          />
        </div>

        {error && <div className="text-[11.5px] text-text-3 mb-2">{error}</div>}
        <button
          type="button"
          onClick={submit}
          disabled={h <= 0 || !projectId || pending}
          className="w-full py-[14px] rounded-[10px] bg-text text-[#050505] border-0 text-[14px] font-medium cursor-pointer disabled:opacity-40"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </>
  );
}
