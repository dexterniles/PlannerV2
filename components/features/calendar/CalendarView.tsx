"use client";

import { useMemo } from "react";

import { useCollection } from "@/lib/hooks/use-collection";
import { formatAbsolute } from "@/lib/utils/dates";

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

export function CalendarView() {
  const { data: items = [], isLoading } =
    useCollection<CalItem>("calendar-items");

  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const it of items) {
      const day = it.date.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(it);
      map.set(day, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Nothing scheduled this month.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {byDay.map(([day, list]) => (
        <div key={day} className="border-b border-border-subtle">
          <div className="bg-bg px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-text-subtle">
            {formatAbsolute(day)}
          </div>
          {list.map((it) => (
            <div
              key={`${it.kind}:${it.id}`}
              className="flex items-center gap-3 px-4 py-2 text-sm"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: KIND_COLOR[it.kind] }}
              />
              <span className="flex-1 truncate text-text">{it.title}</span>
              <span className="text-xs text-text-subtle capitalize">
                {it.kind}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
