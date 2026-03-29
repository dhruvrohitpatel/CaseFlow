type ServiceTypeBarChartProps = {
  items: Array<{ count: number; name: string }>;
};

export function ServiceTypeBarChart({
  items,
}: ServiceTypeBarChartProps) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-sm text-stone-600">
        No service activity yet. Once visits are logged, the service mix will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-900">{item.name}</span>
            <span className="text-stone-600">{item.count}</span>
          </div>
          <div className="h-3 rounded-full bg-stone-100">
            <div
              className="h-3 rounded-full bg-stone-900"
              style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
