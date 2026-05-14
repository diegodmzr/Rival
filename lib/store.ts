"use client";

import { create } from "zustand";
import type {
  DayRecap,
  EntryTaskLink,
  Project,
  Resource,
  ResourceView,
  Task,
  TaskPriority,
  TaskStatus,
  TimeEntry,
  TimerState,
  User,
  UserId,
} from "./types";
import { todayISO } from "./date";

export type TasksView = "list" | "kanban" | "calendar";
export type TasksCalendarMode = "week" | "month";

export interface ServerSnapshot {
  currentUser: User;
  team: User[];
  projects: Project[];
  entries: TimeEntry[];
  timer: TimerState | null;
  recaps: DayRecap[];
  resources: Resource[];
  resourceViews: ResourceView[];
  tasks: Task[];
  entryTasks: EntryTaskLink[];
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
  tasks: Task[];
  entryTasks: Record<string, string[]>;

  // Local UI state
  timer: TimerState;
  hydrated: boolean;
  quickAddOpen: boolean;
  mobileTimerOpen: boolean;
  tasksView: TasksView;
  tasksCalendarMode: TasksCalendarMode;

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
  upsertTask: (task: Task) => void;
  updateTaskLocal: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setEntryTasksLocal: (entryId: string, taskIds: string[]) => void;
  setTasksView: (v: TasksView) => void;
  setTasksCalendarMode: (m: TasksCalendarMode) => void;

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
  tasks: [],
  entryTasks: {},

  timer: DEFAULT_TIMER,
  hydrated: false,
  quickAddOpen: false,
  mobileTimerOpen: false,
  tasksView: "list",
  tasksCalendarMode: "week",

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

      const entryTasksMap: Record<string, string[]> = {};
      for (const link of snap.entryTasks) {
        (entryTasksMap[link.entryId] ||= []).push(link.taskId);
      }

      return {
        currentUserId: snap.currentUser.id,
        users: Object.fromEntries(snap.team.map((u) => [u.id, u])),
        projects: snap.projects,
        entries: snap.entries,
        recaps: snap.recaps,
        resources: snap.resources,
        resourceViews: snap.resourceViews,
        tasks: snap.tasks,
        entryTasks: entryTasksMap,
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

  upsertTask: (task) =>
    set((s) => {
      const idx = s.tasks.findIndex((t) => t.id === task.id);
      if (idx === -1) return { tasks: [...s.tasks, task] };
      const next = s.tasks.slice();
      next[idx] = task;
      return { tasks: next };
    }),

  updateTaskLocal: (id, patch) =>
    set((s) => {
      const idx = s.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const next = s.tasks.slice();
      next[idx] = { ...next[idx], ...patch, updatedAt: new Date().toISOString() };
      return { tasks: next };
    }),

  removeTask: (id) =>
    set((s) => {
      const remainingTasks = s.tasks.filter((t) => t.id !== id && t.parentTaskId !== id);
      const nextEntryTasks: Record<string, string[]> = {};
      for (const [entryId, taskIds] of Object.entries(s.entryTasks)) {
        const filtered = taskIds.filter((tid) => tid !== id);
        if (filtered.length > 0) nextEntryTasks[entryId] = filtered;
      }
      return { tasks: remainingTasks, entryTasks: nextEntryTasks };
    }),

  setEntryTasksLocal: (entryId, taskIds) =>
    set((s) => {
      const next = { ...s.entryTasks };
      if (taskIds.length === 0) delete next[entryId];
      else next[entryId] = taskIds;
      return { entryTasks: next };
    }),

  setTasksView: (v) => {
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem("rival.tasksView", v); } catch {}
    }
    set({ tasksView: v });
  },

  setTasksCalendarMode: (m) => {
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem("rival.tasksCalendarMode", m); } catch {}
    }
    set({ tasksCalendarMode: m });
  },

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

const STATUS_RANK: Record<TaskStatus, number> = {
  in_progress: 0,
  todo: 1,
  done: 2,
};
const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function compareTasks(a: Task, b: Task): number {
  const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (s !== 0) return s;
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.position - b.position;
}

export const selectTasksForProject =
  (projectId: string | null) =>
  (s: AppState): Task[] =>
    s.tasks
      .filter((t) => t.projectId === projectId && t.parentTaskId === null)
      .sort(compareTasks);

export const selectSubtasks =
  (parentId: string) =>
  (s: AppState): Task[] =>
    s.tasks.filter((t) => t.parentTaskId === parentId).sort(compareTasks);

export const selectFreeTasks =
  (userId: UserId) =>
  (s: AppState): Task[] =>
    s.tasks
      .filter(
        (t) =>
          t.projectId === null &&
          t.createdBy === userId &&
          t.parentTaskId === null,
      )
      .sort(compareTasks);

export const selectTodayTasks =
  (userId: UserId) =>
  (s: AppState): Task[] => {
    const today = todayISO();
    return s.tasks
      .filter((t) => {
        if (t.status === "done") return false;
        if (t.parentTaskId !== null) return false;
        if (t.assignedUserId !== null && t.assignedUserId !== userId) return false;
        return t.dueDate === today || t.status === "in_progress" || (t.dueDate !== null && t.dueDate < today);
      })
      .sort(compareTasks);
  };

export const selectTaskHours =
  (taskId: string) =>
  (s: AppState): number => {
    let total = 0;
    for (const [entryId, taskIds] of Object.entries(s.entryTasks)) {
      if (!taskIds.includes(taskId)) continue;
      const entry = s.entries.find((e) => e.id === entryId);
      if (entry) total += entry.hours;
    }
    return total;
  };

export const selectRivalTasksSummary =
  (rivalId: UserId | undefined) =>
  (s: AppState): { inProgress: number; doneThisWeek: number } => {
    if (!rivalId) return { inProgress: 0, doneThisWeek: 0 };
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    let inProgress = 0;
    let doneThisWeek = 0;
    for (const t of s.tasks) {
      if (!t.projectId) continue;
      const proj = s.projects.find((p) => p.id === t.projectId);
      if (!proj || proj.isPersonal) continue;
      if (
        t.status === "in_progress" &&
        (t.assignedUserId === rivalId || t.assignedUserId === null)
      ) {
        inProgress++;
      }
      if (
        t.status === "done" &&
        t.completedBy === rivalId &&
        t.completedAt &&
        new Date(t.completedAt) >= monday
      ) {
        doneThisWeek++;
      }
    }
    return { inProgress, doneThisWeek };
  };

// Kept as an exported constant only for backward-compat with imports elsewhere.
export const TODAY_ISO = todayISO();
