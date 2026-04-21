interface Segment {
  value: number;
  color: string;
}

interface DonutProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
}

export function Donut({ segments, size = 88, thickness = 10 }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={thickness}
      />
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const dash = `${frac * c} ${c}`;
        const offset = -acc * c;
        acc += frac;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray 400ms ease" }}
          />
        );
      })}
    </svg>
  );
}
