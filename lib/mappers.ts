import type {
  DayRecap,
  Project,
  Resource,
  ResourceView,
  TimeEntry,
  TimerState,
  User,
} from "./types";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  initials: string;
  weekly_goal_hours: number | string;
  monthly_goal_hours: number | string;
  avatar_url?: string | null;
  rest_day_weekday?: number | null;
  rest_day_max_hours?: number | string | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  is_personal?: boolean | null;
}

export interface EntryRow {
  id: string;
  user_id: string;
  project_id: string;
  hours: number | string;
  date: string;
  note: string | null;
  category?: string | null;
  created_at: string;
}

export interface TimerRow {
  user_id: string;
  project_id: string | null;
  started_at: string | null;
  elapsed_base_sec: number | string;
  updated_at?: string;
}

export interface RecapRow {
  id: string;
  user_id: string;
  date: string;
  note: string | null;
  updated_at: string;
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    initials: row.initials,
    weeklyGoal: Number(row.weekly_goal_hours),
    monthlyGoal: Number(row.monthly_goal_hours),
    avatarUrl: row.avatar_url ?? null,
    restDayWeekday:
      row.rest_day_weekday === null || row.rest_day_weekday === undefined
        ? null
        : Number(row.rest_day_weekday),
    restDayMaxHours: row.rest_day_max_hours == null ? 0 : Number(row.rest_day_max_hours),
  };
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    isPersonal: row.is_personal ?? false,
  };
}

export function mapEntryRow(row: EntryRow): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    hours: Number(row.hours),
    date: row.date,
    note: row.note ?? "",
    category: row.category ?? null,
    createdAt: row.created_at,
  };
}

export function mapTimerRow(row: TimerRow): TimerState {
  return {
    running: row.started_at !== null,
    startedAt: row.started_at,
    elapsedBase: Number(row.elapsed_base_sec),
    projectId: row.project_id ?? "",
  };
}

export interface ResourceRow {
  id: string;
  kind: "youtube" | "pdf";
  title: string;
  description: string | null;
  category: string | null;
  url: string;
  youtube_id: string | null;
  thumbnail_url: string | null;
  storage_path: string | null;
  added_by: string;
  created_at: string;
}

export interface ResourceViewRow {
  resource_id: string;
  user_id: string;
  status: "watched" | "rewatch";
  updated_at: string;
}

export function mapResourceRow(row: ResourceRow): Resource {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    url: row.url,
    youtubeId: row.youtube_id,
    thumbnailUrl: row.thumbnail_url,
    storagePath: row.storage_path,
    addedBy: row.added_by,
    createdAt: row.created_at,
  };
}

export function mapResourceViewRow(row: ResourceViewRow): ResourceView {
  return {
    resourceId: row.resource_id,
    userId: row.user_id,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function mapRecapRow(row: RecapRow): DayRecap {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    note: row.note ?? "",
    updatedAt: row.updated_at,
  };
}
