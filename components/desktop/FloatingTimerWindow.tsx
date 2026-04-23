"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { PictureInPicture2, Play, Pause, Square } from "lucide-react";
import { useStore } from "@/lib/store";
import { pad2 } from "@/lib/format";
import { todayISO } from "@/lib/date";
import {
  startTimer as startTimerAction,
  pauseTimer as pauseTimerAction,
  setTimerProject as setTimerProjectAction,
  stopTimerAndSave,
} from "@/lib/actions/timer";

type PipAPI = {
  requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>;
};

function getPipAPI(): PipAPI | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { documentPictureInPicture?: PipAPI })
    .documentPictureInPicture ?? null;
}

function copyStylesTo(target: Window) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("");
      const style = target.document.createElement("style");
      style.textContent = rules;
      target.document.head.appendChild(style);
    } catch {
      if (sheet.href) {
        const link = target.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.document.head.appendChild(link);
      }
    }
  }
  target.document.documentElement.style.colorScheme = "dark";
  target.document.body.style.margin = "0";
  target.document.body.style.background = "#050505";
  target.document.body.style.color = "#fafafa";
  target.document.body.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, system-ui, sans-serif";
  target.document.body.style.overflow = "hidden";
  target.document.title = "Rival · Chrono";
}

export function FloatingTimerButton() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(getPipAPI() !== null);
  }, []);

  useEffect(() => {
    return () => {
      if (pipWindow) pipWindow.close();
    };
  }, [pipWindow]);

  if (!supported) return null;

  const open = async () => {
    if (pipWindow) {
      pipWindow.focus();
      return;
    }
    const api = getPipAPI();
    if (!api) return;
    const win = await api.requestWindow({ width: 300, height: 150 });
    copyStylesTo(win);
    const onClose = () => setPipWindow(null);
    win.addEventListener("pagehide", onClose);
    setPipWindow(win);
  };

  return (
    <>
      <button
        onClick={open}
        type="button"
        aria-label="Ouvrir dans une fenêtre flottante"
        title="Fenêtre flottante"
        className="w-[26px] h-[26px] rounded-[5px] bg-surface2 border border-border text-text-2 grid place-items-center cursor-pointer hover:text-text"
      >
        <PictureInPicture2 size={12} strokeWidth={1.3} />
      </button>
      {pipWindow &&
        createPortal(<FloatingTimerContent />, pipWindow.document.body)}
    </>
  );
}

function FloatingTimerContent() {
  const timer = useStore((s) => s.timer);
  const projects = useStore((s) => s.projects);
  const localStart = useStore((s) => s.startTimer);
  const localPause = useStore((s) => s.pauseTimer);
  const localReset = useStore((s) => s.resetTimer);
  const localSetProject = useStore((s) => s.setTimerProject);
  const getElapsed = useStore((s) => s.getTimerElapsed);
  const project = projects.find((p) => p.id === timer.projectId) ?? projects[0];

  const [, setTick] = useState(0);
  const [, startTransition] = useTransition();

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
    <div className="w-full h-[100dvh] flex flex-col bg-bg text-text select-none">
      <div className="flex items-center gap-2 px-3 pt-3">
        <div
          className={`w-[6px] h-[6px] rounded-full ${
            timer.running ? "bg-text animate-pulse" : "bg-text-4"
          }`}
          style={{
            boxShadow: timer.running ? "0 0 0 3px rgba(250,250,250,0.1)" : "none",
          }}
        />
        <select
          value={project?.id ?? ""}
          onChange={(e) => onProjectChange(e.target.value)}
          aria-label="Projet du timer"
          className="text-[11px] text-text-2 bg-transparent outline-none cursor-pointer flex-1 truncate hover:text-text"
        >
          {projects.length === 0 && <option value="">—</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-surface text-text">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 grid place-items-center">
        <div className="font-mono text-[34px] tracking-tight tabular-nums">
          {pad2(h)}:{pad2(m)}:{pad2(s)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-3">
        <button
          onClick={toggle}
          type="button"
          aria-label={timer.running ? "Mettre en pause" : "Démarrer"}
          className="w-[34px] h-[34px] rounded-[6px] bg-text text-[#050505] border-0 grid place-items-center cursor-pointer hover:opacity-90"
        >
          {timer.running ? (
            <Pause size={14} strokeWidth={1.4} />
          ) : (
            <Play size={14} strokeWidth={1.4} />
          )}
        </button>
        {hasElapsed && (
          <button
            onClick={stopAndSave}
            type="button"
            aria-label="Arrêter et enregistrer"
            title="Arrêter & enregistrer"
            className="w-[34px] h-[34px] rounded-[6px] bg-surface2 border border-border text-text-2 grid place-items-center cursor-pointer hover:text-text"
          >
            <Square size={12} strokeWidth={1.4} />
          </button>
        )}
      </div>
    </div>
  );
}
