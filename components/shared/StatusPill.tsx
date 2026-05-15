import { cn } from "@/lib/utils";

type StatusMeta = { label: string; color: string };

const STATUS_META: Record<string, StatusMeta> = {
  not_started: { label: "Todo", color: "var(--color-status-todo)" },
  in_progress: {
    label: "In Progress",
    color: "var(--color-status-in-progress)",
  },
  done: { label: "Done", color: "var(--color-status-done)" },
  cancelled: { label: "Cancelled", color: "var(--color-status-cancelled)" },
  submitted: { label: "Submitted", color: "var(--color-status-in-progress)" },
  graded: { label: "Graded", color: "var(--color-status-done)" },
  planning: { label: "Planning", color: "var(--color-status-todo)" },
  active: { label: "Active", color: "var(--color-status-in-progress)" },
  paused: { label: "Paused", color: "var(--color-status-cancelled)" },
  planned: { label: "Planned", color: "var(--color-status-todo)" },
  completed: { label: "Completed", color: "var(--color-status-done)" },
  dropped: { label: "Dropped", color: "var(--color-status-cancelled)" },
  unpaid: { label: "Unpaid", color: "var(--color-status-blocked)" },
  paid: { label: "Paid", color: "var(--color-status-done)" },
  skipped: { label: "Skipped", color: "var(--color-status-cancelled)" },
  confirmed: { label: "Confirmed", color: "var(--color-status-done)" },
  tentative: {
    label: "Tentative",
    color: "var(--color-status-in-progress)",
  },
};

export function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status;
}

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "var(--color-status-todo)",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors duration-150",
        className,
      )}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
