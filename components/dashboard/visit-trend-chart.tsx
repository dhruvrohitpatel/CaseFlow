type VisitTrendChartProps = {
  points: Array<{ count: number; label: string }>;
};

export function VisitTrendChart({
  points,
}: VisitTrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
        No trend data yet.
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = 24;
  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const polyline = points
    .map((point, index) => {
      const x =
        padding +
        (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        (point.count / maxCount) * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-4">
      <svg
        aria-label="Visits over time"
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
        {points.map((point, index) => {
          const x =
            padding +
            (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
          const y =
            height -
            padding -
            (point.count / maxCount) * (height - padding * 2);

          return (
            <g key={point.label}>
              <circle cx={x} cy={y} fill="currentColor" r="4" />
              <text
                className="fill-stone-500 text-[11px]"
                textAnchor="middle"
                x={x}
                y={height - 6}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-4 gap-2 text-xs text-stone-600 sm:grid-cols-8">
        {points.map((point) => (
          <div key={`${point.label}-${point.count}`} className="rounded-lg bg-stone-50 px-2 py-1">
            <div className="font-medium text-stone-900">{point.count}</div>
            <div>{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
