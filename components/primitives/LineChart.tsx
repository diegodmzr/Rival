"use client";

import { useMemo } from "react";

interface LineChartProps {
  a: number[];
  b: number[];
  width?: number;
  height?: number;
  padX?: number;
  padY?: number;
  colors?: [string, string];
  showAxis?: boolean;
}

// Two overlaid series. Expects arrays newest-first — reversed for rendering.
export function LineChart({
  a,
  b,
  width = 560,
  height = 160,
  padX = 0,
  padY = 14,
  colors = ["#fafafa", "#737373"],
  showAxis = true,
}: LineChartProps) {
  const data = useMemo(() => {
    const A = [...a].reverse();
    const B = [...b].reverse();
    const n = A.length;
    const max = Math.max(...A, ...B, 8);
    const toX = (i: number) => padX + (i / (n - 1)) * (width - padX * 2);
    const toY = (v: number) => height - padY - (v / max) * (height - padY * 2);
    const path = (arr: number[]) =>
      arr
        .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
        .join(" ");
    const area = (arr: number[]) =>
      `${path(arr)} L ${toX(n - 1)} ${height - padY} L ${toX(0)} ${height - padY} Z`;
    return { A, B, n, toX, toY, path, area };
  }, [a, b, width, height, padX, padY]);

  const gridLines = [0.25, 0.5, 0.75];

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {showAxis &&
        gridLines.map((g, i) => (
          <line
            key={i}
            x1={padX}
            x2={width - padX}
            y1={padY + g * (height - padY * 2)}
            y2={padY + g * (height - padY * 2)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}
      <defs>
        <linearGradient id="areaA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="0.12" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={data.area(data.A)} fill="url(#areaA)" />
      <path
        d={data.path(data.B)}
        stroke={colors[1]}
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 3"
      />
      <path d={data.path(data.A)} stroke={colors[0]} strokeWidth="1.4" fill="none" />
      {data.A.map((v, i) => (
        <circle
          key={`a${i}`}
          cx={data.toX(i)}
          cy={data.toY(v)}
          r={i === data.n - 1 ? 3 : 0}
          fill={colors[0]}
        />
      ))}
    </svg>
  );
}
