import type { CustomFieldDisplayValue } from "@/lib/custom-fields";

type CustomFieldDisplayListProps = {
  emptyMessage?: string;
  title?: string;
  values: CustomFieldDisplayValue[];
};

export function CustomFieldDisplayList({
  emptyMessage = "No custom values recorded.",
  title = "Custom fields",
  values,
}: CustomFieldDisplayListProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
          {title}
        </h3>
      </div>
      {values.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((value) => (
            <div key={value.definitionId}>
              <p className="text-sm font-medium text-stone-500">{value.label}</p>
              <p className="mt-1 text-sm text-stone-900">{value.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-600">{emptyMessage}</p>
      )}
    </div>
  );
}
