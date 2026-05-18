import type { RecurrenceFreq, RecurrenceRule, Task } from "./types";

export const MAX_GENERATED_OCCURRENCES = 100;
export const DEFAULT_HORIZON_DAYS = 365;

export const FREQ_LABEL: Record<RecurrenceFreq, string> = {
  daily: "jour",
  weekly: "semaine",
  monthly: "mois",
  yearly: "an",
};

export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
export const WEEKDAY_LABELS_LONG = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function jsWeekdayToMondayBased(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function validateRecurrence(rule: RecurrenceRule): string | null {
  if (!Number.isInteger(rule.interval) || rule.interval < 1) {
    return "Intervalle invalide.";
  }
  if (rule.freq === "weekly") {
    if (!rule.weekdays || rule.weekdays.length === 0) {
      return "Sélectionne au moins un jour de la semaine.";
    }
    if (rule.weekdays.some((d) => d < 0 || d > 6)) {
      return "Jour invalide.";
    }
  }
  if (rule.end.type === "count") {
    if (!Number.isInteger(rule.end.count) || rule.end.count < 1 || rule.end.count > MAX_GENERATED_OCCURRENCES) {
      return `Le nombre d'occurrences doit être entre 1 et ${MAX_GENERATED_OCCURRENCES}.`;
    }
  }
  if (rule.end.type === "until") {
    if (!rule.end.date) return "Date de fin requise.";
  }
  return null;
}

/**
 * Compute the list of occurrence dates (ISO yyyy-mm-dd) for a recurrence rule
 * starting at `startISO`. The first occurrence is always >= startISO. Capped by
 * MAX_GENERATED_OCCURRENCES and by the configured end mode.
 */
export function generateOccurrenceDates(
  rule: RecurrenceRule,
  startISO: string,
): string[] {
  const start = parseISODate(startISO);
  if (Number.isNaN(start.getTime())) return [];

  const out: string[] = [];
  const horizon = new Date(start);
  horizon.setDate(horizon.getDate() + DEFAULT_HORIZON_DAYS);

  let untilDate: Date | null = null;
  let maxCount = MAX_GENERATED_OCCURRENCES;
  if (rule.end.type === "until") {
    untilDate = parseISODate(rule.end.date);
  } else if (rule.end.type === "count") {
    maxCount = Math.min(MAX_GENERATED_OCCURRENCES, rule.end.count);
  }

  const pushIfOk = (d: Date) => {
    if (untilDate && d.getTime() > untilDate.getTime()) return false;
    if (!untilDate && d.getTime() > horizon.getTime()) return false;
    out.push(toISODate(d));
    return out.length < maxCount;
  };

  if (rule.freq === "daily") {
    const step = rule.interval;
    let cur = new Date(start);
    while (out.length < maxCount) {
      if (!pushIfOk(cur)) break;
      cur = new Date(cur);
      cur.setDate(cur.getDate() + step);
    }
  } else if (rule.freq === "weekly") {
    const weekdays = [...(rule.weekdays ?? [])].sort((a, b) => a - b);
    const step = rule.interval;
    // anchor at the Monday of the week of `start`
    const anchorMon = new Date(start);
    const startWeekday = jsWeekdayToMondayBased(anchorMon);
    anchorMon.setDate(anchorMon.getDate() - startWeekday);

    let week = 0;
    while (out.length < maxCount) {
      const cycleMon = new Date(anchorMon);
      cycleMon.setDate(cycleMon.getDate() + week * 7 * step);
      let stop = false;
      for (const wd of weekdays) {
        const d = new Date(cycleMon);
        d.setDate(d.getDate() + wd);
        if (d.getTime() < start.getTime()) continue;
        if (untilDate && d.getTime() > untilDate.getTime()) {
          stop = true;
          break;
        }
        if (!untilDate && d.getTime() > horizon.getTime()) {
          stop = true;
          break;
        }
        out.push(toISODate(d));
        if (out.length >= maxCount) {
          stop = true;
          break;
        }
      }
      if (stop) break;
      week += 1;
      if (week > 520) break; // safety: 10 years of weeks
    }
  } else if (rule.freq === "monthly") {
    const step = rule.interval;
    let cur = new Date(start);
    while (out.length < maxCount) {
      if (!pushIfOk(cur)) break;
      cur = new Date(cur);
      cur.setMonth(cur.getMonth() + step);
    }
  } else if (rule.freq === "yearly") {
    const step = rule.interval;
    let cur = new Date(start);
    while (out.length < maxCount) {
      if (!pushIfOk(cur)) break;
      cur = new Date(cur);
      cur.setFullYear(cur.getFullYear() + step);
    }
  }

  return out;
}

/**
 * Identifier of the recurring series a task belongs to, or null if it's a
 * standalone task. The mother task uses its own id; occurrences use their
 * recurrence_parent_id.
 */
export function seriesKey(task: Task): string | null {
  if (task.recurrenceParentId) return task.recurrenceParentId;
  if (task.recurrence) return task.id;
  return null;
}

/**
 * For each recurring series, keep all completed occurrences (shown grayed)
 * and only the next (earliest by due date, then position) non-completed
 * occurrence. Non-recurring tasks are returned unchanged.
 */
export function collapseRecurringSeries(tasks: Task[]): Task[] {
  const pendingBest = new Map<string, Task>();
  const otherKept: Task[] = [];
  const doneKept: Task[] = [];

  const betterPending = (a: Task, b: Task): Task => {
    const ad = a.dueDate ?? "9999-12-31";
    const bd = b.dueDate ?? "9999-12-31";
    if (ad !== bd) return ad < bd ? a : b;
    if (a.position !== b.position) return a.position < b.position ? a : b;
    return a.createdAt < b.createdAt ? a : b;
  };

  for (const t of tasks) {
    const key = seriesKey(t);
    if (!key) {
      otherKept.push(t);
      continue;
    }
    if (t.status === "done") {
      doneKept.push(t);
      continue;
    }
    const cur = pendingBest.get(key);
    pendingBest.set(key, cur ? betterPending(cur, t) : t);
  }

  return [...otherKept, ...doneKept, ...pendingBest.values()];
}

export function describeRecurrence(rule: RecurrenceRule): string {
  const n = rule.interval;
  const every = n === 1 ? "Tous les" : `Tous les ${n}`;
  let body: string;

  if (rule.freq === "daily") {
    body = n === 1 ? "Tous les jours" : `${every} jours`;
  } else if (rule.freq === "weekly") {
    const days = (rule.weekdays ?? [])
      .slice()
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_LABELS_LONG[d])
      .join(", ");
    const cycle =
      n === 1 ? "chaque semaine" : `une semaine sur ${n}`;
    body = `${days} (${cycle})`;
  } else if (rule.freq === "monthly") {
    body = n === 1 ? "Tous les mois" : `${every} mois`;
  } else {
    body = n === 1 ? "Tous les ans" : `${every} ans`;
  }

  if (rule.end.type === "until") {
    body += ` jusqu'au ${rule.end.date}`;
  } else if (rule.end.type === "count") {
    body += ` (${rule.end.count} fois)`;
  }
  return body;
}
