import type { TimeEntry, UserId } from "./types";
import { daysAgoISO, diffDays, todayISO } from "./date";

export function hoursOnDate(entries: TimeEntry[], userId: UserId, iso: string): number {
  let s = 0;
  for (const e of entries) {
    if (e.userId === userId && e.date === iso) s += e.hours;
  }
  return s;
}

export function hoursInLastDays(
  entries: TimeEntry[],
  userId: UserId,
  days: number,
): number {
  const today = todayISO();
  let s = 0;
  for (const e of entries) {
    if (e.userId !== userId) continue;
    const d = diffDays(today, e.date);
    if (d >= 0 && d < days) s += e.hours;
  }
  return s;
}

export function todayHours(entries: TimeEntry[], userId: UserId): number {
  return hoursOnDate(entries, userId, todayISO());
}

export function weekHours(entries: TimeEntry[], userId: UserId): number {
  return hoursInLastDays(entries, userId, 7);
}

export function monthHours(entries: TimeEntry[], userId: UserId): number {
  return hoursInLastDays(entries, userId, 30);
}

// Daily series, newest first (index 0 = today)
export function dailySeries(
  entries: TimeEntry[],
  userId: UserId,
  days: number,
): number[] {
  const out = new Array(days).fill(0);
  for (const e of entries) {
    if (e.userId !== userId) continue;
    const d = diffDays(todayISO(), e.date);
    if (d >= 0 && d < days) out[d] += e.hours;
  }
  return out;
}

export interface HeatmapCell {
  offset: number;
  hours: number;
  date: string;
}

export function heatmapCells(
  entries: TimeEntry[],
  userId: UserId,
  days: number = 91,
): HeatmapCell[] {
  const out: HeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgoISO(i);
    out.push({ offset: i, date, hours: hoursOnDate(entries, userId, date) });
  }
  return out;
}

export function streakDays(entries: TimeEntry[], userId: UserId): number {
  const series = dailySeries(entries, userId, 60);
  let n = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i] >= 1) n++;
    else break;
  }
  return n;
}

export function longestStreak(entries: TimeEntry[], userId: UserId): number {
  const series = dailySeries(entries, userId, 365);
  let best = 0;
  let cur = 0;
  for (const h of series) {
    if (h >= 1) {
      cur++;
      if (cur > best) best = cur;
    } else cur = 0;
  }
  return best;
}

export function bestDay(entries: TimeEntry[], userId: UserId): { hours: number; date: string | null; daysAgo: number } {
  const series = dailySeries(entries, userId, 60);
  let best = 0;
  let bestIdx = -1;
  series.forEach((h, i) => {
    if (h > best) {
      best = h;
      bestIdx = i;
    }
  });
  return {
    hours: best,
    date: bestIdx >= 0 ? daysAgoISO(bestIdx) : null,
    daysAgo: bestIdx,
  };
}

export interface ProjectStat {
  projectId: string;
  hours: Record<UserId, number>;
  total: number;
}

export function projectBreakdown(
  entries: TimeEntry[],
  days: number = 30,
  userIds: UserId[] = ["diego", "ismael"],
): Record<string, ProjectStat> {
  const today = todayISO();
  const map: Record<string, ProjectStat> = {};
  for (const e of entries) {
    const d = diffDays(today, e.date);
    if (d < 0 || d >= days) continue;
    if (!map[e.projectId]) {
      map[e.projectId] = {
        projectId: e.projectId,
        hours: Object.fromEntries(userIds.map((u) => [u, 0])) as Record<UserId, number>,
        total: 0,
      };
    }
    if (map[e.projectId].hours[e.userId] === undefined) {
      map[e.projectId].hours[e.userId] = 0;
    }
    map[e.projectId].hours[e.userId] += e.hours;
    map[e.projectId].total += e.hours;
  }
  return map;
}

export interface BadgeComputed {
  id: string;
  label: string;
  earned: boolean;
  progress?: number;
  when?: string | null;
}

export function computeBadges(entries: TimeEntry[], userId: UserId, monthlyGoal: number): BadgeComputed[] {
  const streak = streakDays(entries, userId);
  const longest = longestStreak(entries, userId);
  const best = bestDay(entries, userId);
  const month = monthHours(entries, userId);
  const week = weekHours(entries, userId);

  const consistency = (() => {
    const s = dailySeries(entries, userId, 30);
    return s.filter((h) => h >= 1).length / 30;
  })();

  // Early-bird: any entry created before 08:00 in the last 7 days
  const early = (() => {
    const today = todayISO();
    return entries.some((e) => {
      if (e.userId !== userId) return false;
      const d = diffDays(today, e.date);
      if (d < 0 || d >= 7) return false;
      const hh = new Date(e.createdAt).getHours();
      return hh < 8;
    });
  })();

  return [
    {
      id: "streak7",
      label: "7 jours de suite",
      earned: longest >= 7,
      when: longest >= 7 ? `record ${longest}j` : null,
      progress: Math.min(1, streak / 7),
    },
    {
      id: "early",
      label: "Lève-tôt (avant 8h)",
      earned: early,
      when: early ? "cette semaine" : null,
    },
    {
      id: "marathon",
      label: "10h en 1 jour",
      earned: best.hours >= 10,
      when: best.hours >= 10 ? `il y a ${best.daysAgo}j` : null,
      progress: Math.min(1, best.hours / 10),
    },
    {
      id: "month160",
      label: `${monthlyGoal}h ce mois`,
      earned: month >= monthlyGoal,
      progress: Math.min(1, month / monthlyGoal),
    },
    {
      id: "firstplace",
      label: "#1 de la semaine",
      earned: false,
      progress: Math.min(1, week / 40),
    },
    {
      id: "consistent",
      label: "30 jours / 30",
      earned: consistency >= 1,
      progress: consistency,
    },
  ];
}
