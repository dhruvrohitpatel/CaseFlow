import { AlertTriangle } from "lucide-react";

type PageErrorStateProps = {
  description: string;
  title?: string;
};

export function PageErrorState({
  description,
  title = "This section is unavailable right now.",
}: PageErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 leading-6">{description}</p>
        </div>
      </div>
    </div>
  );
}
