import type { ReactNode } from "react";

interface RingProps {
  value: number;
  size?: number;
  thickness?: number;
  trackColor?: string;
  color?: string;
  children?: ReactNode;
}

export function Ring({
  value,
  size = 48,
  thickness = 4,
  trackColor = "rgba(255,255,255,0.08)",
  color = "#fafafa",
  children,
}: RingProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${v * c} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 500ms ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 10,
        }}
      >
        {children}
      </div>
    </div>
  );
}
