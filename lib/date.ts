// Local-date helpers. All dates stored as yyyy-mm-dd in user's local time.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function diffDays(a: string, b: string): number {
  const ms = parseISODate(a).getTime() - parseISODate(b).getTime();
  return Math.round(ms / (24 * 3600 * 1000));
}

const WEEKDAYS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const WEEKDAYS_LONG = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];

export function formatRelativeDate(iso: string, createdAt?: string): string {
  const today = todayISO();
  const d = diffDays(today, iso);
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";
  if (d === 0) return time ? `Aujourd'hui ${time}` : "Aujourd'hui";
  if (d === 1) return time ? `Hier ${time}` : "Hier";
  if (d < 7) {
    const date = parseISODate(iso);
    const wd = WEEKDAYS_LONG[date.getDay()];
    return time ? `${wd} ${time}` : wd;
  }
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function weekNumber(d: Date = new Date()): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export function formatHeaderDate(d: Date = new Date()): string {
  const wd = WEEKDAYS_LONG[d.getDay()];
  return `${wd} ${d.getDate()} ${MONTHS[d.getMonth()]} · Semaine ${weekNumber(d)}`;
}

export function formatShortHeaderDate(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
