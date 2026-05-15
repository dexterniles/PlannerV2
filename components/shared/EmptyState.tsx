import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Kbd } from "@/components/shared/Kbd";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  headline,
  body,
  action,
  shortcut,
  className,
}: {
  icon: LucideIcon;
  headline: string;
  body?: string;
  action?: ReactNode;
  shortcut?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated">
        <Icon className="size-5 text-text-subtle" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-text">{headline}</h2>
        {body ? (
          <p className="max-w-sm text-sm text-text-muted">{body}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
      {shortcut ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-subtle">
          or press <Kbd keys={shortcut} />
        </p>
      ) : null}
    </div>
  );
}
