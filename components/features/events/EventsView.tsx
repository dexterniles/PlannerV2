"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ListView, type ListGroup } from "@/components/shared/ListView";
import { StatusPill } from "@/components/shared/StatusPill";
import { useCollection } from "@/lib/hooks/use-collection";
import { formatAbsolute } from "@/lib/utils/dates";

type EventRow = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  location: string | null;
};

export function EventsView() {
  const router = useRouter();
  const { data: events = [], isLoading } = useCollection<EventRow>("events");
  const [now] = useState(() => Date.now());

  const groups: ListGroup<EventRow>[] = useMemo(() => {
    const upcoming: EventRow[] = [];
    const past: EventRow[] = [];
    for (const e of events) {
      (new Date(e.startsAt).getTime() >= now ? upcoming : past).push(e);
    }
    const out: ListGroup<EventRow>[] = [];
    if (upcoming.length) {
      out.push({ key: "upcoming", label: "Upcoming", items: upcoming });
    }
    if (past.length) {
      out.push({
        key: "past",
        label: "Past",
        items: past.reverse(),
      });
    }
    return out;
  }, [events, now]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        No events.
      </div>
    );
  }

  return (
    <ListView
      groups={groups}
      getId={(e) => e.id}
      activeId={null}
      onRowClick={(e) => router.push(`/events?detail=event:${e.id}`)}
      renderRow={(e) => (
        <>
          <span className="w-40 shrink-0 text-xs text-text-muted tabular-nums">
            {formatAbsolute(e.startsAt)}
          </span>
          <span className="flex-1 truncate text-sm text-text">{e.title}</span>
          {e.location ? (
            <span className="shrink-0 text-xs text-text-subtle">
              {e.location}
            </span>
          ) : null}
          <span className="w-24 shrink-0">
            <StatusPill status={e.status} />
          </span>
        </>
      )}
    />
  );
}
