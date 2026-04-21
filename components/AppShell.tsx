"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/desktop/Sidebar";
import { TopBar } from "@/components/desktop/TopBar";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { QuickAddSheet } from "@/components/mobile/QuickAddSheet";
import { MobileTimerSheet } from "@/components/mobile/MobileTimerSheet";
import { StoreHydrator } from "@/components/StoreHydrator";
import { useStore, type ServerSnapshot } from "@/lib/store";

export function AppShell({
  data,
  children,
}: {
  data: ServerSnapshot;
  children: React.ReactNode;
}) {
  const hydrated = useStore((s) => s.hydrated);
  const openQuickAdd = useStore((s) => s.openQuickAdd);
  const quickAddOpen = useStore((s) => s.quickAddOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!quickAddOpen) openQuickAdd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openQuickAdd, quickAddOpen]);

  return (
    <>
      <StoreHydrator data={data} />
      {!hydrated ? (
        <div className="w-full h-screen bg-bg grid place-items-center">
          <div className="text-text-3 text-[12px] font-mono">chargement…</div>
        </div>
      ) : (
        <>
          <div className="hidden md:flex w-full h-screen bg-bg text-text overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <div className="flex-1 overflow-auto">{children}</div>
            </div>
          </div>

          <div
            className="md:hidden relative w-full min-h-screen bg-bg text-text flex flex-col"
            style={{
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <MobileHeader />
            <div className="flex-1 pb-[120px]">{children}</div>
            <MobileBottomNav />
          </div>

          <QuickAddSheet />
          <MobileTimerSheet />
        </>
      )}
    </>
  );
}
