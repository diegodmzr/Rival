// Totals display: floor to the nearest 15 min so a goal only "flips"
// once you've genuinely crossed the next quarter-hour.
export const fmt = (h: number): string => {
  const totalMin = Math.floor(Math.max(0, h) * 60 / 15) * 15;
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0 && mm === 0) return "0h";
  if (hh === 0) return `${mm}min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
};

export const fmtParts = (h: number): { main: string; suffix: string } => {
  const totalMin = Math.floor(Math.max(0, h) * 60 / 15) * 15;
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0 && mm === 0) return { main: "0", suffix: "h" };
  if (hh === 0) return { main: String(mm), suffix: "min" };
  if (mm === 0) return { main: String(hh), suffix: "h" };
  return { main: String(hh), suffix: `h${String(mm).padStart(2, "0")}` };
};

// Exact minute display — used for individual time entries so a short
// chrono isn't erased to "0h" in the history.
export const fmtExact = (h: number): string => {
  const totalMin = Math.round(Math.max(0, h) * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh === 0 && mm === 0) return "0min";
  if (hh === 0) return `${mm}min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h${String(mm).padStart(2, "0")}`;
};

export const fmtDiff = (a: number, b: number): string => {
  const d = a - b;
  if (Math.abs(d) < 0.01) return "±0h";
  return (d > 0 ? "+" : "-") + fmt(Math.abs(d));
};

export const pct = (n: number): string => `${Math.round(n * 100)}%`;

export const pad2 = (n: number): string => String(n).padStart(2, "0");
