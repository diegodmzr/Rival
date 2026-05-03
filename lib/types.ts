export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  initials: string;
  email: string;
  weeklyGoal: number;
  monthlyGoal: number;
  avatarUrl: string | null;
  restDayWeekday: number | null; // 0 = Sunday ... 6 = Saturday
  restDayMaxHours: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  createdBy: UserId;
  isPersonal: boolean;
}

export interface TimeEntry {
  id: string;
  userId: UserId;
  projectId: string;
  hours: number;
  date: string; // yyyy-mm-dd (local date)
  note: string;
  category: string | null;
  createdAt: string; // ISO
}

export interface TimerState {
  running: boolean;
  startedAt: string | null;
  elapsedBase: number;
  projectId: string;
}

export interface DayRecap {
  id: string;
  userId: UserId;
  date: string; // yyyy-mm-dd (local date)
  note: string;
  updatedAt: string; // ISO
}

export type ResourceKind = "youtube" | "pdf";
export type ResourceStatus = "to_watch" | "watched" | "rewatch";

export interface Resource {
  id: string;
  kind: ResourceKind;
  title: string;
  description: string;
  category: string;
  url: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  addedBy: UserId;
  createdAt: string;
}

export interface ResourceView {
  resourceId: string;
  userId: UserId;
  status: Exclude<ResourceStatus, "to_watch">;
  updatedAt: string;
}
