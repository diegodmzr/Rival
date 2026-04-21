import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Project, TimeEntry, TimerState, User, UserId } from "@/lib/types";

function mapUser(row: {
  id: string;
  email: string;
  name: string;
  initials: string;
  weekly_goal_hours: number | string;
  monthly_goal_hours: number | string;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    initials: row.initials,
    weeklyGoal: Number(row.weekly_goal_hours),
    monthlyGoal: Number(row.monthly_goal_hours),
  };
}

function mapProject(row: {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapEntry(row: {
  id: string;
  user_id: string;
  project_id: string;
  hours: number | string;
  date: string;
  note: string;
  created_at: string;
}): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    hours: Number(row.hours),
    date: row.date,
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

export async function getSessionUserId(): Promise<UserId | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapUser(data);
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapUser);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapProject);
}

export async function getEntries(): Promise<TimeEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEntry);
}

export async function getEntriesForProject(projectId: string): Promise<TimeEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEntry);
}

export async function getActiveTimer(): Promise<TimerState | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("active_timers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;

  return {
    running: data.started_at !== null,
    startedAt: data.started_at,
    elapsedBase: Number(data.elapsed_base_sec),
    projectId: data.project_id ?? "",
  };
}

export interface DashboardData {
  currentUser: User;
  team: User[];
  projects: Project[];
  entries: TimeEntry[];
  timer: TimerState | null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const [currentUser, team, projects, entries, timer] = await Promise.all([
    getCurrentUser(),
    getAllUsers(),
    getProjects(),
    getEntries(),
    getActiveTimer(),
  ]);
  if (!currentUser) return null;
  return { currentUser, team, projects, entries, timer };
}
