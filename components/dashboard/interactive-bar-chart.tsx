"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ChartPoint } from "@/lib/dashboard-data";

type InteractiveBarChartProps = {
  emptyMessage: string;
  points: ChartPoint[];
};

export function InteractiveBarChart({
  emptyMessage,
  points,
}: InteractiveBarChartProps) {
  const router = useRouter();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-[rgb(var(--brand-surface-rgb)/0.5)] px-6 py-10 text-sm text-stone-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-h-5 text-sm text-stone-500">
        {activeLabel
          ? `Viewing ${activeLabel}. Click a bar to open the filtered detail view.`
          : "Hover for detail. Click a bar to open the filtered view."}
      </div>
      {points.map((point) => (
        <button
          key={`${point.label}-${point.value}`}
          className="block w-full space-y-2 text-left"
          onClick={() => router.push(point.href)}
          onMouseEnter={() => setActiveLabel(`${point.label}: ${point.value}`)}
          onMouseLeave={() => setActiveLabel(null)}
          title={`${point.label}: ${point.value}`}
          type="button"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-900">{point.label}</span>
            <span className="text-stone-600">{point.value}</span>
          </div>
          <div className="h-3 rounded-full bg-[rgb(var(--brand-surface-rgb)/0.65)]">
            <div
              className="h-3 rounded-full bg-[color:var(--brand-primary)] transition-all"
              style={{ width: `${Math.max((point.value / maxValue) * 100, 8)}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
