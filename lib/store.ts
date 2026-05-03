"use client";

import { create } from "zustand";
import type {
  DayRecap,
  Project,
  Resource,
  ResourceView,
  TimeEntry,
  TimerState,
  User,
  UserId,
} from "./types";
import { todayISO } from "./date";

export interface ServerSnapshot {
  currentUser: User;
  team: User[];
  projects: Project[];
  entries: TimeEntry[];
  timer: TimerState | null;
  recaps: DayRecap[];
  resources: Resource[];
  resourceViews: ResourceView[];
}

interface AppState {
  // Server-hydrated mirror (read-only from the app's perspective)
  currentUserId: UserId;
  users: Record<UserId, User>;
  projects: Project[];
  entries: TimeEntry[];
  recaps: DayRecap[];
  resources: Resource[];
  resourceViews: ResourceView[];

  // Local UI state
  timer: TimerState;
  hydrated: boolean;
  quickAddOpen: boolean;
  mobileTimerOpen: boolean;

  // Hydration (called by StoreHydrator on every server re-render)
  hydrate: (snapshot: ServerSnapshot) => void;

  // Realtime patches (called by RealtimeSync from Supabase Realtime events)
  applyTimer: (timer: TimerState | null) => void;
  upsertEntry: (entry: TimeEntry) => void;
  removeEntry: (id: string) => void;
  upsertProject: (project: Project) => void;
  removeProject: (id: string) => void;
  upsertUser: (user: User) => void;
  upsertRecap: (recap: DayRecap) => void;
  removeRecap: (id: string) => void;
  setLocalRecap: (date: string, note: string) => void;
  upsertResource: (resource: Resource) => void;
  removeResource: (id: string) => void;
  upsertResourceView: (view: ResourceView) => void;
  removeResourceView: (resourceId: string, userId: UserId) => void;

  // UI actions
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openMobileTimer: () => void;
  closeMobileTimer: () => void;

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
  recaps: [],
  resources: [],
  resourceViews: [],

  timer: DEFAULT_TIMER,
  hydrated: false,
  quickAddOpen: false,
  mobileTimerOpen: false,

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
        recaps: snap.recaps,
        resources: snap.resources,
        resourceViews: snap.resourceViews,
        hydrated: true,
        timer: nextTimer,
      };
    }),

  applyTimer: (incoming) =>
    set((s) => {
      if (!incoming) {
        return {
          timer: {
            ...DEFAULT_TIMER,
            projectId: s.timer.projectId,
          },
        };
      }
      const fallbackProjectId = s.projects[0]?.id ?? "";
      const resolved =
        incoming.projectId && s.projects.some((p) => p.id === incoming.projectId)
          ? incoming.projectId
          : fallbackProjectId;
      return {
        timer: {
          running: incoming.running,
          startedAt: incoming.startedAt,
          elapsedBase: incoming.elapsedBase,
          projectId: resolved,
        },
      };
    }),

  upsertEntry: (entry) =>
    set((s) => {
      const idx = s.entries.findIndex((e) => e.id === entry.id);
      if (idx === -1) {
        return { entries: [entry, ...s.entries] };
      }
      const next = s.entries.slice();
      next[idx] = entry;
      return { entries: next };
    }),

  removeEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  upsertProject: (project) =>
    set((s) => {
      const idx = s.projects.findIndex((p) => p.id === project.id);
      if (idx === -1) {
        return { projects: [...s.projects, project] };
      }
      const next = s.projects.slice();
      next[idx] = project;
      return { projects: next };
    }),

  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  upsertUser: (user) =>
    set((s) => ({ users: { ...s.users, [user.id]: user } })),

  upsertRecap: (recap) =>
    set((s) => {
      const idx = s.recaps.findIndex(
        (r) => r.userId === recap.userId && r.date === recap.date,
      );
      if (idx === -1) {
        return { recaps: [recap, ...s.recaps] };
      }
      const next = s.recaps.slice();
      next[idx] = recap;
      return { recaps: next };
    }),

  removeRecap: (id) =>
    set((s) => ({ recaps: s.recaps.filter((r) => r.id !== id) })),

  // Local optimistic update for the current user's recap for a given day.
  // `note` is stored as-is here so the textarea stays responsive; the server
  // action trims and persists (or deletes if empty).
  setLocalRecap: (date, note) =>
    set((s) => {
      const userId = s.currentUserId;
      if (!userId) return s;
      const idx = s.recaps.findIndex(
        (r) => r.userId === userId && r.date === date,
      );
      if (idx === -1) {
        const placeholder: DayRecap = {
          id: `local-${userId}-${date}`,
          userId,
          date,
          note,
          updatedAt: new Date().toISOString(),
        };
        return { recaps: [placeholder, ...s.recaps] };
      }
      const next = s.recaps.slice();
      next[idx] = { ...next[idx], note, updatedAt: new Date().toISOString() };
      return { recaps: next };
    }),

  upsertResource: (resource) =>
    set((s) => {
      const idx = s.resources.findIndex((r) => r.id === resource.id);
      if (idx === -1) return { resources: [resource, ...s.resources] };
      const next = s.resources.slice();
      next[idx] = resource;
      return { resources: next };
    }),

  removeResource: (id) =>
    set((s) => ({
      resources: s.resources.filter((r) => r.id !== id),
      resourceViews: s.resourceViews.filter((v) => v.resourceId !== id),
    })),

  upsertResourceView: (view) =>
    set((s) => {
      const idx = s.resourceViews.findIndex(
        (v) => v.resourceId === view.resourceId && v.userId === view.userId,
      );
      if (idx === -1) return { resourceViews: [view, ...s.resourceViews] };
      const next = s.resourceViews.slice();
      next[idx] = view;
      return { resourceViews: next };
    }),

  removeResourceView: (resourceId, userId) =>
    set((s) => ({
      resourceViews: s.resourceViews.filter(
        (v) => !(v.resourceId === resourceId && v.userId === userId),
      ),
    })),

  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  openMobileTimer: () => set({ mobileTimerOpen: true }),
  closeMobileTimer: () => set({ mobileTimerOpen: false }),

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
