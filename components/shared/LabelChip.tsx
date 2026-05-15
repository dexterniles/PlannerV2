import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export function LabelChip({
  name,
  color,
  onRemove,
  className,
}: {
  name: string;
  color?: string | null;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-xs text-text-muted",
        className,
      )}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color ?? "var(--color-text-subtle)" }}
      />
      {name}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="text-text-subtle hover:text-text"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
