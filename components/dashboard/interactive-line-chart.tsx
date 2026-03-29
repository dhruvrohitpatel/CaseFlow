"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ChartPoint } from "@/lib/dashboard-data";

type InteractiveLineChartProps = {
  emptyMessage: string;
  points: ChartPoint[];
};

export function InteractiveLineChart({
  emptyMessage,
  points,
}: InteractiveLineChartProps) {
  const router = useRouter();
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
        {emptyMessage}
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = 24;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points.map((point, index) => {
    const x =
      padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height - padding - (point.value / maxValue) * (height - padding * 2);

    return {
      ...point,
      x,
      y,
    };
  });
  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="space-y-4">
      <div className="min-h-5 text-sm text-stone-500">
        {activePoint
          ? `${activePoint.label}: ${activePoint.value}. Click a point to open the filtered detail view.`
          : "Hover for detail. Click a point to open the filtered view."}
      </div>
      <svg
        aria-label="Interactive trend"
        className="w-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          x1={padding}
          x2={width - padding}
          y1={height - padding}
          y2={height - padding}
        />
        <polyline
          fill="none"
          points={polyline}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {coordinates.map((point) => (
          <g key={point.label}>
            <circle
              className="cursor-pointer"
              cx={point.x}
              cy={point.y}
              fill="currentColor"
              onClick={() => router.push(point.href)}
              onMouseEnter={() => setActivePoint(point)}
              onMouseLeave={() => setActivePoint(null)}
              r="6"
            />
            <text
              className="fill-stone-500 text-[11px]"
              textAnchor="middle"
              x={point.x}
              y={height - 6}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
