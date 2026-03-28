import { cn } from "@/lib/utils";

type FormMessageProps = {
  className?: string;
  message?: string;
  tone?: "error" | "success";
};

export function FormMessage({
  className,
  message,
  tone = "error",
}: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      {message}
    </div>
  );
}
