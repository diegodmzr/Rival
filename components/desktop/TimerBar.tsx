"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Pause, Square } from "lucide-react";
import { useStore } from "@/lib/store";
import { pad2 } from "@/lib/format";
import { todayISO } from "@/lib/date";
import {
  startTimer as startTimerAction,
  pauseTimer as pauseTimerAction,
  setTimerProject as setTimerProjectAction,
  stopTimerAndSave,
} from "@/lib/actions/timer";
import { FloatingTimerButton } from "./FloatingTimerWindow";

export function TimerBar() {
  const timer = useStore((s) => s.timer);
  const projects = useStore((s) => s.projects);
  const localStart = useStore((s) => s.startTimer);
  const localPause = useStore((s) => s.pauseTimer);
  const localReset = useStore((s) => s.resetTimer);
  const localSetProject = useStore((s) => s.setTimerProject);
  const getElapsed = useStore((s) => s.getTimerElapsed);
  const project = projects.find((p) => p.id === timer.projectId) ?? projects[0];

  const [, setTick] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const elapsed = getElapsed();
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);

  const hasElapsed = elapsed > 0 || timer.running;

  const toggle = () => {
    const projectId = project?.id;
    if (timer.running) {
      localPause();
      startTransition(async () => {
        await pauseTimerAction();
      });
    } else {
      if (!projectId) return;
      localStart(projectId);
      startTransition(async () => {
        await startTimerAction(projectId);
      });
    }
  };

  const stopAndSave = () => {
    localPause();
    localReset();
    startTransition(async () => {
      await stopTimerAndSave(todayISO());
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
      className={`flex items-center gap-[10px] pl-[14px] pr-2 py-[6px] rounded-md ${
        timer.running
          ? "bg-white/[0.04] border border-white/[0.15]"
          : "bg-surface2 border border-border"
      }`}
    >
      <div
        className={`w-[6px] h-[6px] rounded-full ${
          timer.running ? "bg-text animate-pulse" : "bg-text-4"
        }`}
        style={{ boxShadow: timer.running ? "0 0 0 3px rgba(250,250,250,0.1)" : "none" }}
      />
      <div className="font-mono text-[13px] text-text min-w-[64px]">
        {pad2(h)}:{pad2(m)}:{pad2(s)}
      </div>
      <select
        value={project?.id ?? ""}
        onChange={(e) => onProjectChange(e.target.value)}
        aria-label="Projet du timer"
        className="text-[11px] text-text-3 border-l border-border pl-[10px] bg-transparent outline-none cursor-pointer max-w-[160px] truncate hover:text-text-2 focus:text-text"
      >
        {projects.length === 0 && <option value="">—</option>}
        {projects.map((p) => (
          <option key={p.id} value={p.id} className="bg-surface text-text">
            {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={toggle}
        type="button"
        aria-label={timer.running ? "Mettre en pause" : "Démarrer"}
        className="ml-1 w-[26px] h-[26px] rounded-[5px] bg-text text-[#050505] border-0 grid place-items-center cursor-pointer hover:opacity-90"
      >
        {timer.running ? <Pause size={12} strokeWidth={1.3} /> : <Play size={12} strokeWidth={1.3} />}
      </button>
      {hasElapsed && (
        <button
          onClick={stopAndSave}
          disabled={pending}
          type="button"
          aria-label="Arrêter et enregistrer"
          className="w-[26px] h-[26px] rounded-[5px] bg-surface2 border border-border text-text-2 grid place-items-center cursor-pointer hover:text-text disabled:opacity-40"
          title="Arrêter & enregistrer"
        >
          <Square size={10} strokeWidth={1.3} />
        </button>
      )}
      <FloatingTimerButton />
    </div>
  );
}
