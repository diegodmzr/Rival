export const fmt = (h: number): string => {
  if (h === 0) return "0h";
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}h`;
};

export const fmtDiff = (a: number, b: number): string => {
  const d = a - b;
  if (Math.abs(d) < 0.01) return "±0h";
  return (d > 0 ? "+" : "") + fmt(d);
};

export const pct = (n: number): string => `${Math.round(n * 100)}%`;

export const fmtMetric = (v: number): string =>
  v.toFixed(v % 1 === 0 ? 0 : 2).replace(/0+$/, "").replace(/\.$/, "");

export const pad2 = (n: number): string => String(n).padStart(2, "0");
