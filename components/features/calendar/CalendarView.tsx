"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalItem = {
  kind: "event" | "task" | "assignment" | "bill";
  id: string;
  title: string;
  date: string;
};

const KIND_COLOR: Record<CalItem["kind"], string> = {
  event: "var(--color-status-done)",
  task: "var(--color-accent)",
  assignment: "var(--color-status-in-progress)",
  bill: "var(--color-status-blocked)",
};

const KIND_ROUTE: Record<CalItem["kind"], string> = {
  event: "/events?detail=event:",
  task: "/issues?detail=task:",
  assignment: "/issues?detail=assignment:",
  bill: "/money",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const router = useRouter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd],
  );

  const [kinds, setKinds] = useState<Set<CalItem["kind"]>>(
    () => new Set(["event", "task", "assignment", "bill"]),
  );
  const toggleKind = (k: CalItem["kind"]) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const { data: items = [] } = useQuery<CalItem[]>({
    queryKey: [
      "calendar-items",
      gridStart.toISOString(),
      gridEnd.toISOString(),
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar-items?from=${gridStart.toISOString()}&to=${gridEnd.toISOString()}`,
      );
      if (!res.ok) throw new Error("Failed to load calendar");
      const json = (await res.json()) as { data: CalItem[] };
      return json.data;
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const it of items) {
      if (!kinds.has(it.kind)) continue;
      const day = it.date.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(it);
      map.set(day, list);
    }
    return map;
  }, [items, kinds]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-4">
        <span className="text-sm font-medium text-text">
          {format(month, "MMMM yyyy")}
        </span>
        <div className="flex items-center gap-1">
          {(["task", "assignment", "event", "bill"] as const).map((k) => {
            const on = kinds.has(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleKind(k)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs capitalize transition-opacity hover:bg-bg-hover",
                  on ? "text-text" : "text-text-subtle opacity-50",
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: KIND_COLOR[k] }}
                />
                {k}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-7 border-b border-border-subtle">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-xs font-medium text-text-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 grid-rows-[repeat(6,minmax(0,1fr))] overflow-y-auto">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          return (
            <div
              key={key}
              className={cn(
                "flex min-h-20 flex-col gap-0.5 border-b border-r border-border-subtle p-1",
                !inMonth && "bg-bg-elevated/40",
              )}
            >
              <span
                className={cn(
                  "self-end text-xs tabular-nums",
                  inMonth ? "text-text-muted" : "text-text-subtle",
                  isToday(day) &&
                    "flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              {dayItems.slice(0, 4).map((it) => (
                <button
                  key={`${it.kind}:${it.id}`}
                  type="button"
                  onClick={() =>
                    router.push(`${KIND_ROUTE[it.kind]}${it.id}`)
                  }
                  className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs text-text hover:bg-bg-hover"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: KIND_COLOR[it.kind] }}
                  />
                  <span className="truncate">{it.title}</span>
                </button>
              ))}
              {dayItems.length > 4 ? (
                <span className="px-1 text-xs text-text-subtle">
                  +{dayItems.length - 4} more
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
