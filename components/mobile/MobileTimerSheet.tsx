"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Pause, Square, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { pad2 } from "@/lib/format";
import { todayISO } from "@/lib/date";
import {
  startTimer as startTimerAction,
  pauseTimer as pauseTimerAction,
  setTimerProject as setTimerProjectAction,
  stopTimerAndSave,
} from "@/lib/actions/timer";

export function MobileTimerSheet() {
  const open = useStore((s) => s.mobileTimerOpen);
  const close = useStore((s) => s.closeMobileTimer);
  const timer = useStore((s) => s.timer);
  const projects = useStore((s) => s.projects);
  const localStart = useStore((s) => s.startTimer);
  const localPause = useStore((s) => s.pauseTimer);
  const localReset = useStore((s) => s.resetTimer);
  const localSetProject = useStore((s) => s.setTimerProject);
  const getElapsed = useStore((s) => s.getTimerElapsed);

  const [, setTick] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !timer.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [open, timer.running]);

  if (!open) return null;

  const elapsed = getElapsed();
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);
  const hasElapsed = elapsed > 0 || timer.running;

  const project =
    projects.find((p) => p.id === timer.projectId) ?? projects[0];

  const toggle = () => {
    const projectId = project?.id;
    setError(null);
    if (timer.running) {
      localPause();
      startTransition(async () => {
        const res = await pauseTimerAction();
        if (!res.ok) setError(res.error ?? "Erreur.");
      });
    } else {
      if (!projectId) {
        setError("Choisis un projet.");
        return;
      }
      localStart(projectId);
      startTransition(async () => {
        const res = await startTimerAction(projectId);
        if (!res.ok) setError(res.error ?? "Erreur.");
      });
    }
  };

  const stopAndSave = () => {
    setError(null);
    localPause();
    localReset();
    startTransition(async () => {
      const res = await stopTimerAndSave(todayISO());
      if (!res.ok) setError(res.error ?? "Erreur.");
      else close();
    });
  };

  const onProjectChange = (projectId: string) => {
    localSetProject(projectId);
    startTransition(async () => {
      await setTimerProjectAction(projectId);
    });
  };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[90] bg-black/60 flex items-end md:items-center justify-center animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[440px] rounded-t-2xl md:rounded-2xl bg-surface border border-border-strong px-[18px] pt-2 pb-7 animate-slideUp max-h-[90vh] overflow-y-auto"
      >
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-[6px] mb-[14px] md:hidden" />
        <div className="flex items-center justify-between mb-[14px]">
          <div className="flex items-center gap-[8px]">
            <div
              className={`w-[7px] h-[7px] rounded-full ${
                timer.running ? "bg-text animate-pulse" : "bg-text-4"
              }`}
              style={{
                boxShadow: timer.running
                  ? "0 0 0 3px rgba(250,250,250,0.1)"
                  : "none",
              }}
            />
            <div className="text-[15px] text-text font-medium">
              {timer.running ? "En cours" : "Chrono"}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="text-text-3 cursor-pointer bg-transparent border-0 p-1"
          >
            <X size={18} strokeWidth={1.3} />
          </button>
        </div>

        <div className="bg-surface2 border border-border rounded-[10px] py-[22px] mb-3 text-center">
          <div
            className="font-mono text-[52px] text-text font-medium tracking-[-1.2px] leading-none"
            aria-live="polite"
          >
            {pad2(h)}:{pad2(m)}:{pad2(s)}
          </div>
          <div className="text-[10.5px] text-text-4 font-mono mt-[10px] uppercase tracking-[0.8px]">
            {timer.running
              ? "Actif — continue même si tu fermes l’app"
              : hasElapsed
                ? "En pause"
                : "Prêt"}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[10.5px] text-text-3 uppercase tracking-[0.6px] font-mono mb-[6px]">
            Projet
          </div>
          <div className="flex gap-[6px] flex-wrap">
            {projects.length === 0 && (
              <div className="text-[11.5px] text-text-3">
                Crée un projet d’abord.
              </div>
            )}
            {projects.map((p) => {
              const active = p.id === (project?.id ?? "");
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onProjectChange(p.id)}
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

        {error && (
          <div className="text-[11.5px] text-text-3 mb-2">{error}</div>
        )}

        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={pending || (!timer.running && !project)}
            className="flex-1 py-[14px] rounded-[10px] bg-text text-[#050505] border-0 text-[14px] font-medium cursor-pointer disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {timer.running ? (
              <>
                <Pause size={15} strokeWidth={1.6} />
                Pause
              </>
            ) : (
              <>
                <Play size={15} strokeWidth={1.6} />
                {hasElapsed ? "Reprendre" : "Démarrer"}
              </>
            )}
          </button>
          {hasElapsed && (
            <button
              type="button"
              onClick={stopAndSave}
              disabled={pending}
              className="px-4 rounded-[10px] bg-surface2 border border-border text-text inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              aria-label="Arrêter et enregistrer"
              title="Arrêter & enregistrer"
            >
              <Square size={13} strokeWidth={1.4} />
              <span className="text-[13px]">Stop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
