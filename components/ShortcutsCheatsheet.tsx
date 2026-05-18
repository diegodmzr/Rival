"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { useStore } from "@/lib/store";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";

export function ShortcutsCheatsheet() {
  const open = useStore((s) => s.shortcutsOpen);
  const close = useStore((s) => s.closeShortcuts);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-xl rounded-t-2xl sm:rounded-lg bg-surface border border-border shadow-xl max-h-[92vh] flex flex-col">
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-[6px] sm:hidden" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2 text-[14px] text-text font-medium">
            <Keyboard size={14} strokeWidth={1.4} />
            Raccourcis clavier
          </div>
          <button
            onClick={close}
            className="text-text-3 hover:text-text"
            aria-label="Fermer"
          >
            <X size={14} strokeWidth={1.3} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <div className="text-[10.5px] text-text-3 uppercase tracking-wide font-mono mb-2">
                {group.title}
              </div>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-center justify-between gap-3 text-[12.5px]"
                  >
                    <span className="text-text-2">{item.description}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx > 0 && (
                            <span className="text-text-3 text-[10px]">puis</span>
                          )}
                          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded border border-border bg-bg text-text text-[10.5px] font-mono">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border text-[10.5px] text-text-3 font-mono">
          Astuce&nbsp;: appuie sur <kbd className="px-1 rounded bg-bg border border-border">?</kbd> à tout moment pour rouvrir ce panneau.
        </div>
      </div>
    </div>
  );
}
