"use client";

import { create } from "zustand";
import type { Project, TimeEntry, TimerState, User, UserId } from "./types";
import { todayISO } from "./date";

export interface ServerSnapshot {
  currentUser: User;
  team: User[];
  projects: Project[];
  entries: TimeEntry[];
  timer: TimerState | null;
}

interface AppState {
  // Server-hydrated mirror (read-only from the app's perspective)
  currentUserId: UserId;
  users: Record<UserId, User>;
  projects: Project[];
  entries: TimeEntry[];

  // Local UI state
  timer: TimerState;
  hydrated: boolean;
  quickAddOpen: boolean;

  // Hydration (called by StoreHydrator on every server re-render)
  hydrate: (snapshot: ServerSnapshot) => void;

  // UI actions
  openQuickAdd: () => void;
  closeQuickAdd: () => void;

  // Timer (local only — its final value is persisted via a server action)
  startTimer: (projectId?: string) => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  setTimerProject: (projectId: string) => void;
  resetTimer: () => void;
  getTimerElapsed: () => number;
  getTimerHoursRounded: () => number;
}

const DEFAULT_TIMER: TimerState = {
  running: false,
  startedAt: null,
  elapsedBase: 0,
  projectId: "",
};

export const useStore = create<AppState>()((set, get) => ({
  currentUserId: "",
  users: {},
  projects: [],
  entries: [],

  timer: DEFAULT_TIMER,
  hydrated: false,
  quickAddOpen: false,

  hydrate: (snap) =>
    set((s) => {
      const fallbackProjectId = snap.projects[0]?.id ?? "";
      const resolveProjectId = (id: string | undefined | null) =>
        id && snap.projects.some((p) => p.id === id) ? id : fallbackProjectId;

      const nextTimer: TimerState = snap.timer
        ? {
            running: snap.timer.running,
            startedAt: snap.timer.startedAt,
            elapsedBase: snap.timer.elapsedBase,
            projectId: resolveProjectId(snap.timer.projectId),
          }
        : {
            ...s.timer,
            running: false,
            startedAt: null,
            elapsedBase: 0,
            projectId: resolveProjectId(s.timer.projectId),
          };

      return {
        currentUserId: snap.currentUser.id,
        users: Object.fromEntries(snap.team.map((u) => [u.id, u])),
        projects: snap.projects,
        entries: snap.entries,
        hydrated: true,
        timer: nextTimer,
      };
    }),

  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),

  startTimer: (projectId) =>
    set((s) => ({
      timer: {
        ...s.timer,
        running: true,
        startedAt: new Date().toISOString(),
        projectId: projectId ?? s.timer.projectId,
      },
    })),

  pauseTimer: () =>
    set((s) => {
      if (!s.timer.running || !s.timer.startedAt) return s;
      const started = new Date(s.timer.startedAt).getTime();
      const addSec = Math.max(0, (Date.now() - started) / 1000);
      return {
        timer: {
          ...s.timer,
          running: false,
          startedAt: null,
          elapsedBase: s.timer.elapsedBase + addSec,
        },
      };
    }),

  toggleTimer: () => {
    const running = get().timer.running;
    if (running) get().pauseTimer();
    else get().startTimer();
  },

  setTimerProject: (projectId) =>
    set((s) => ({ timer: { ...s.timer, projectId } })),

  resetTimer: () =>
    set((s) => ({
      timer: { ...DEFAULT_TIMER, projectId: s.timer.projectId },
    })),

  getTimerElapsed: () => {
    const t = get().timer;
    let sec = t.elapsedBase;
    if (t.running && t.startedAt) {
      sec += Math.max(0, (Date.now() - new Date(t.startedAt).getTime()) / 1000);
    }
    return sec;
  },

  getTimerHoursRounded: () => {
    const sec = get().getTimerElapsed();
    return Math.round((sec / 3600) * 4) / 4;
  },
}));

export const selectCurrentUser = (s: AppState) => s.users[s.currentUserId];
export const selectRivalUser = (s: AppState) => {
  const others = Object.values(s.users).filter((u) => u.id !== s.currentUserId);
  return others[0] ?? s.users[s.currentUserId];
};

// Kept as an exported constant only for backward-compat with imports elsewhere.
export const TODAY_ISO = todayISO();
