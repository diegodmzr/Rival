"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Clock, Folder, Plus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useStore } from "@/lib/store";
import { pad2 } from "@/lib/format";
import { todayISO } from "@/lib/date";
import { stopTimerAndSave } from "@/lib/actions/timer";

const NAV_LEFT = [
  { id: "home", href: "/", Icon: Home, label: "Accueil" },
  { id: "stats", href: "/stats", Icon: BarChart3, label: "Stats" },
];

const NAV_RIGHT = [
  { id: "hist", href: "/history", Icon: Clock, label: "Hist." },
  { id: "proj", href: "/projects", Icon: Folder, label: "Projets" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const timer = useStore((s) => s.timer);
  const getTimerElapsed = useStore((s) => s.getTimerElapsed);
  const pause = useStore((s) => s.pauseTimer);
  const reset = useStore((s) => s.resetTimer);
  const openQuickAdd = useStore((s) => s.openQuickAdd);

  const [, tick] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const elapsed = getTimerElapsed();
  const running = timer.running || elapsed > 0;
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);

  const stopAndSave = () => {
    pause();
    reset();
    startTransition(async () => {
      await stopTimerAndSave(todayISO());
    });
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pb-[22px] z-40"
      style={{
        background:
          "linear-gradient(to top, rgba(5,5,5,1) 60%, rgba(5,5,5,0))",
      }}
    >
      {running && (
        <div
          className="mx-4 mb-[10px] px-3 py-[9px] bg-surface border border-border-strong rounded-full flex items-center gap-[10px]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-[6px] h-[6px] rounded-full bg-text animate-pulse"
            style={{ boxShadow: "0 0 0 3px rgba(250,250,250,0.1)" }}
          />
          <div className="font-mono text-[12px] text-text">
            {pad2(h)}:{pad2(m)}:{pad2(s)}
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={stopAndSave}
            disabled={pending}
            className="text-[10.5px] text-text-2 font-mono bg-transparent border-0 cursor-pointer disabled:opacity-40"
          >
            {pending ? "…" : "arrêter"}
          </button>
        </div>
      )}

      <div
        className="mx-3 px-1 pt-2 pb-[10px] border border-border rounded-full flex items-center justify-around relative"
        style={{
          background: "rgba(10,10,10,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        {NAV_LEFT.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`flex flex-col items-center gap-[3px] px-[10px] py-1 ${
                active ? "text-text" : "text-text-3"
              }`}
            >
              <it.Icon size={18} strokeWidth={1.3} />
              <span className="text-[9.5px] font-medium">{it.label}</span>
            </Link>
          );
        })}

        <button
          onClick={openQuickAdd}
          type="button"
          aria-label="Ajouter des heures"
          className="w-12 h-12 rounded-full bg-text text-[#050505] border-0 grid place-items-center cursor-pointer -mt-[14px]"
          style={{
            boxShadow:
              "0 4px 18px rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.3) inset",
          }}
        >
          <Plus size={20} strokeWidth={1.4} />
        </button>

        {NAV_RIGHT.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.id}
              href={it.href}
              className={`flex flex-col items-center gap-[3px] px-[10px] py-1 ${
                active ? "text-text" : "text-text-3"
              }`}
            >
              <it.Icon size={18} strokeWidth={1.3} />
              <span className="text-[9.5px] font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
