export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  initials: string;
  email: string;
  weeklyGoal: number;
  monthlyGoal: number;
  avatarUrl: string | null;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  createdBy: UserId;
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
