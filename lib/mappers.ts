import type {
  DayRecap,
  EntryTaskLink,
  Project,
  RecurrenceRule,
  Resource,
  ResourceView,
  Task,
  TaskAttachment,
  TaskAttachmentKind,
  TaskPriority,
  TaskStatus,
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

export interface TaskRow {
  id: string;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_user_id: string | null;
  created_by: string;
  completed_by: string | null;
  completed_at: string | null;
  is_shared?: boolean | null;
  completed_user_ids?: string[] | null;
  recurrence?: unknown;
  recurrence_parent_id?: string | null;
  position: number | string;
  created_at: string;
  updated_at: string;
}

export interface EntryTaskRow {
  entry_id: string;
  task_id: string;
}

export function mapTaskRow(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assignedUserId: row.assigned_user_id,
    createdBy: row.created_by,
    completedBy: row.completed_by,
    completedAt: row.completed_at,
    isShared: row.is_shared ?? false,
    completedUserIds: row.completed_user_ids ?? [],
    recurrence: (row.recurrence as RecurrenceRule | null) ?? null,
    recurrenceParentId: row.recurrence_parent_id ?? null,
    position: Number(row.position),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEntryTaskRow(row: EntryTaskRow): EntryTaskLink {
  return { entryId: row.entry_id, taskId: row.task_id };
}

export interface TaskAttachmentRow {
  id: string;
  task_id: string;
  kind: TaskAttachmentKind;
  name: string;
  url: string;
  storage_path: string | null;
  size_bytes: number | string | null;
  mime: string | null;
  created_by: string;
  created_at: string;
}

export function mapTaskAttachmentRow(row: TaskAttachmentRow): TaskAttachment {
  return {
    id: row.id,
    taskId: row.task_id,
    kind: row.kind,
    name: row.name,
    url: row.url,
    storagePath: row.storage_path,
    sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes),
    mime: row.mime,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
