"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const NAV_KEYS: Record<string, string> = {
  d: "/",
  t: "/tasks",
  s: "/stats",
  p: "/projects",
  h: "/history",
  r: "/recap",
  l: "/resources",
  ",": "/settings",
};

const VIEW_KEYS: Record<string, "list" | "kanban" | "calendar"> = {
  l: "list",
  k: "kanban",
  c: "calendar",
};

const SEARCH_INPUT_SELECTOR =
  'input[placeholder="Rechercher"], input[type="search"]';

function isEditable(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const openQuickAdd = useStore((s) => s.openQuickAdd);
  const openTaskCreator = useStore((s) => s.openTaskCreator);
  const openShortcuts = useStore((s) => s.openShortcuts);
  const closeShortcuts = useStore((s) => s.closeShortcuts);
  const setTasksView = useStore((s) => s.setTasksView);
  const quickAddOpen = useStore((s) => s.quickAddOpen);
  const taskCreatorOpen = useStore((s) => s.taskCreatorOpen);
  const shortcutsOpen = useStore((s) => s.shortcutsOpen);

  const prefix = useRef<"g" | "v" | null>(null);
  const prefixTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPrefix = () => {
      prefix.current = null;
      if (prefixTimeout.current) {
        clearTimeout(prefixTimeout.current);
        prefixTimeout.current = null;
      }
    };

    const armPrefix = (p: "g" | "v") => {
      prefix.current = p;
      if (prefixTimeout.current) clearTimeout(prefixTimeout.current);
      prefixTimeout.current = setTimeout(clearPrefix, 1200);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const editable = isEditable(e.target);

      // "?" works everywhere outside editables — Shift+/
      if (key === "?" && !editable) {
        e.preventDefault();
        if (shortcutsOpen) closeShortcuts();
        else openShortcuts();
        clearPrefix();
        return;
      }

      // Slash focuses search if not editing
      if (key === "/" && !editable) {
        const input = document.querySelector<HTMLInputElement>(
          SEARCH_INPUT_SELECTOR,
        );
        if (input) {
          e.preventDefault();
          input.focus();
          input.select?.();
          clearPrefix();
          return;
        }
      }

      if (editable) return;

      // Handle prefix sequences (g + …, v + …)
      if (prefix.current === "g") {
        const target = NAV_KEYS[key];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
        clearPrefix();
        return;
      }
      if (prefix.current === "v") {
        const target = VIEW_KEYS[key];
        if (target) {
          e.preventDefault();
          setTasksView(target);
        }
        clearPrefix();
        return;
      }

      // Arm prefixes
      if (key === "g") {
        e.preventDefault();
        armPrefix("g");
        return;
      }
      if (key === "v") {
        e.preventDefault();
        armPrefix("v");
        return;
      }

      // Single-key actions
      if (key === "n") {
        e.preventDefault();
        if (!quickAddOpen) openQuickAdd();
        return;
      }
      if (key === "t") {
        e.preventDefault();
        if (!taskCreatorOpen) openTaskCreator();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (prefixTimeout.current) clearTimeout(prefixTimeout.current);
    };
  }, [
    router,
    openQuickAdd,
    openTaskCreator,
    openShortcuts,
    closeShortcuts,
    setTasksView,
    quickAddOpen,
    taskCreatorOpen,
    shortcutsOpen,
  ]);

  return null;
}
