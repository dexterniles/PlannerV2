import { formatAbsolute, formatRelativeDue } from "@/lib/utils/dates";
import { cn } from "@/lib/utils";

export function DueDate({
  value,
  className,
}: {
  value: string | Date | null | undefined;
  className?: string;
}) {
  const rel = formatRelativeDue(value);
  if (!rel) return null;

  return (
    <span
      title={formatAbsolute(value)}
      className={cn(
        "text-xs tabular-nums",
        rel.overdue ? "text-status-blocked" : "text-text-muted",
        className,
      )}
      style={rel.overdue ? { color: "var(--color-status-blocked)" } : undefined}
    >
      {rel.label}
    </span>
  );
}
