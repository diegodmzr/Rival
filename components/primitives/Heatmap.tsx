import { fmt } from "@/lib/format";

export interface HeatmapCellLike {
  hours: number;
  date?: string;
  offset?: number;
}

interface HeatmapProps {
  days: HeatmapCellLike[];
  cell?: number;
  gap?: number;
}

export function Heatmap({ days, cell = 11, gap = 3 }: HeatmapProps) {
  // `days` is oldest → newest when passed from compute.heatmapCells
  const max = Math.max(...days.map((d) => d.hours), 1);
  const weeks: HeatmapCellLike[][] = [];
  for (let w = 0; w < Math.ceil(days.length / 7); w++) {
    weeks.push(days.slice(w * 7, w * 7 + 7));
  }
  const intensity = (h: number) => {
    if (h === 0) return "rgba(255,255,255,0.04)";
    const lvl = Math.min(4, Math.ceil((h / max) * 4));
    const steps = [0.12, 0.22, 0.4, 0.65, 0.95];
    return `rgba(250,250,250,${steps[lvl]})`;
  };
  return (
    <div style={{ display: "flex", gap }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap }}>
          {week.map((d, di) => (
            <div
              key={di}
              title={`${fmt(d.hours)}${d.date ? ` · ${d.date}` : ""}`}
              style={{
                width: cell,
                height: cell,
                background: intensity(d.hours),
                borderRadius: 2,
              }}
            />
          ))}
          {Array.from({ length: 7 - week.length }).map((_, i) => (
            <div key={`pad${i}`} style={{ width: cell, height: cell }} />
          ))}
        </div>
      ))}
    </div>
  );
}
