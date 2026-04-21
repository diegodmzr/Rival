import type { Project, TimeEntry, User, UserId } from "./types";

function csvCell(s: string | number): string {
  const str = String(s);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function entriesToCSV(
  entries: TimeEntry[],
  users: Record<UserId, User>,
  projects: Project[],
): string {
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const header = ["date", "user", "project", "hours", "note", "createdAt"];
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const rows = sorted.map((e) =>
    [
      e.date,
      users[e.userId]?.name ?? e.userId,
      projectMap[e.projectId] ?? e.projectId,
      e.hours.toString(),
      e.note,
      e.createdAt,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportEntriesCSV(
  entries: TimeEntry[],
  users: Record<UserId, User>,
  projects: Project[],
) {
  const csv = entriesToCSV(entries, users, projects);
  const today = new Date().toISOString().slice(0, 10);
  downloadCSV(`productivity-${today}.csv`, csv);
}
