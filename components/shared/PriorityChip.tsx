import { cn } from "@/lib/utils";

export type Priority = "low" | "medium" | "high" | "urgent";

const META: Record<Priority, { label: string; bars: number; color: string }> =
  {
    urgent: { label: "Urgent", bars: 4, color: "var(--color-priority-1)" },
    high: { label: "High", bars: 3, color: "var(--color-priority-2)" },
    medium: { label: "Medium", bars: 2, color: "var(--color-priority-3)" },
    low: { label: "Low", bars: 1, color: "var(--color-priority-4)" },
  };

export function PriorityChip({
  priority,
  showLabel = false,
  className,
}: {
  priority: Priority | null;
  showLabel?: boolean;
  className?: string;
}) {
  if (!priority) {
    return (
      <span
        className={cn("inline-flex items-end gap-px", className)}
        title="No priority"
        aria-label="No priority"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 rounded-xs bg-border-strong"
            style={{ height: `${(i + 1) * 3 + 2}px` }}
          />
        ))}
      </span>
    );
  }

  const meta = META[priority];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={meta.label}
      aria-label={`Priority: ${meta.label}`}
    >
      <span className="inline-flex items-end gap-px">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 rounded-xs"
            style={{
              height: `${(i + 1) * 3 + 2}px`,
              backgroundColor:
                i < meta.bars - 1 || meta.bars === 4
                  ? meta.color
                  : "var(--color-border-strong)",
            }}
          />
        ))}
      </span>
      {showLabel ? (
        <span className="text-sm text-text-muted">{meta.label}</span>
      ) : null}
    </span>
  );
}
