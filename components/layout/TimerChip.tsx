"use client";

import { Square, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useActiveTimer, useStopTimer } from "@/lib/hooks/use-timer";

const ROUTE: Record<string, string> = {
  task: "/issues?detail=task:",
  assignment: "/issues?detail=assignment:",
  project: "/projects?detail=project:",
  course: "/courses?detail=course:",
};

function format(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function TimerChip() {
  const { data: timer } = useActiveTimer();
  const stop = useStopTimer();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return null;

  const elapsed = (now - new Date(timer.startedAt).getTime()) / 1000;

  return (
    <div className="flex h-7 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-elevated pl-2 pr-1 text-xs">
      <button
        type="button"
        onClick={() =>
          router.push(`${ROUTE[timer.loggableType]}${timer.loggableId}`)
        }
        className="flex items-center gap-1.5 text-text-muted hover:text-text"
        title="Jump to timed item"
      >
        <Timer className="size-3.5 text-brand" />
        <span className="tabular-nums">{format(elapsed)}</span>
      </button>
      <button
        type="button"
        aria-label="Stop timer"
        onClick={() => stop.mutate(timer.id)}
        className="flex size-5 items-center justify-center rounded hover:bg-bg-hover"
      >
        <Square className="size-3 fill-current text-text-muted" />
      </button>
    </div>
  );
}
