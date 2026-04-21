interface HBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
}

export function HBar({ value, max, color = "#fafafa", height = 4 }: HBarProps) {
  return (
    <div
      style={{
        height,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, (value / max) * 100)}%`,
          background: color,
          borderRadius: 999,
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}
