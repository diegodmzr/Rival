import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DayRecap, Project, TimeEntry, TimerState, User, UserId } from "@/lib/types";
import {
  mapEntryRow,
  mapProjectRow,
  mapRecapRow,
  mapTimerRow,
  mapUserRow,
} from "@/lib/mappers";

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
  return mapUserRow(data);
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapUserRow);
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("is_personal", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapProjectRow);
}

export async function getEntries(): Promise<TimeEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEntryRow);
}

export async function getEntriesForProject(projectId: string): Promise<TimeEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEntryRow);
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

  return mapTimerRow(data);
}

export async function getRecaps(): Promise<DayRecap[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("day_recaps")
    .select("*")
    .order("date", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRecapRow);
}

export interface DashboardData {
  currentUser: User;
  team: User[];
  projects: Project[];
  entries: TimeEntry[];
  timer: TimerState | null;
  recaps: DayRecap[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const [currentUser, team, projects, entries, timer, recaps] = await Promise.all([
    getCurrentUser(),
    getAllUsers(),
    getProjects(),
    getEntries(),
    getActiveTimer(),
    getRecaps(),
  ]);
  if (!currentUser) return null;
  return { currentUser, team, projects, entries, timer, recaps };
}
