import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { assignments, bills, events, tasks } from "@/lib/db/schema";

// Open = still actionable. Completed/cancelled/paid are excluded everywhere
// in Round 1 (Today timeline, heatmap, overdue) per the agreed behavior.
const OPEN_TASK = ["not_started", "in_progress"] as const;
const OPEN_ASSIGNMENT = ["not_started", "in_progress"] as const;
const OPEN_EVENT = ["confirmed", "tentative"] as const;

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

function dayStartUTC(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

export type AgendaItem = {
  kind: "event" | "task" | "assignment" | "bill";
  id: string;
  title: string;
  at: string;
  route: string;
};

function routeFor(kind: AgendaItem["kind"], id: string): string {
  switch (kind) {
    case "task":
      return `/issues?detail=task:${id}`;
    case "assignment":
      return `/issues?detail=assignment:${id}`;
    case "event":
      return `/events?detail=event:${id}`;
    case "bill":
      return "/money";
  }
}

export async function getTodayAgenda(
  userId: string,
  now = new Date(),
): Promise<AgendaItem[]> {
  const start = dayStartUTC(now);
  const end = addDays(start, 1);
  const out: AgendaItem[] = [];

  const evs = await db
    .select({ id: events.id, title: events.title, at: events.startsAt })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        inArray(events.status, [...OPEN_EVENT]),
        gte(events.startsAt, start),
        lt(events.startsAt, end),
      ),
    );
  for (const e of evs)
    out.push({
      kind: "event",
      id: e.id,
      title: e.title,
      at: e.at.toISOString(),
      route: routeFor("event", e.id),
    });

  const tks = await db
    .select({ id: tasks.id, title: tasks.title, at: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, [...OPEN_TASK]),
        gte(tasks.dueDate, start),
        lt(tasks.dueDate, end),
      ),
    );
  for (const t of tks)
    if (t.at)
      out.push({
        kind: "task",
        id: t.id,
        title: t.title,
        at: t.at.toISOString(),
        route: routeFor("task", t.id),
      });

  const asg = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      at: assignments.dueDate,
    })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        inArray(assignments.status, [...OPEN_ASSIGNMENT]),
        gte(assignments.dueDate, start),
        lt(assignments.dueDate, end),
      ),
    );
  for (const a of asg)
    if (a.at)
      out.push({
        kind: "assignment",
        id: a.id,
        title: a.title,
        at: a.at.toISOString(),
        route: routeFor("assignment", a.id),
      });

  const bl = await db
    .select({ id: bills.id, title: bills.name, at: bills.dueDate })
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        eq(bills.status, "unpaid"),
        gte(bills.dueDate, dateStr(start)),
        lt(bills.dueDate, dateStr(end)),
      ),
    );
  for (const b of bl)
    out.push({
      kind: "bill",
      id: b.id,
      title: b.title,
      at: `${b.at}T00:00:00.000Z`,
      route: routeFor("bill", b.id),
    });

  return out.sort((a, b) => (a.at < b.at ? -1 : 1));
}

export type HeatmapCell = { date: string; count: number };

export async function getDueHeatmap(
  userId: string,
  days = 21,
  now = new Date(),
): Promise<HeatmapCell[]> {
  const start = dayStartUTC(now);
  const end = addDays(start, days);
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    counts.set(dateStr(addDays(start, i)), 0);
  }
  const bump = (key: string) => {
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  };

  const tks = await db
    .select({ at: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, [...OPEN_TASK]),
        gte(tasks.dueDate, start),
        lt(tasks.dueDate, end),
      ),
    );
  for (const t of tks) if (t.at) bump(dateStr(t.at));

  const asg = await db
    .select({ at: assignments.dueDate })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        inArray(assignments.status, [...OPEN_ASSIGNMENT]),
        gte(assignments.dueDate, start),
        lt(assignments.dueDate, end),
      ),
    );
  for (const a of asg) if (a.at) bump(dateStr(a.at));

  const evs = await db
    .select({ at: events.startsAt })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        inArray(events.status, [...OPEN_EVENT]),
        gte(events.startsAt, start),
        lt(events.startsAt, end),
      ),
    );
  for (const e of evs) bump(dateStr(e.at));

  const bl = await db
    .select({ at: bills.dueDate })
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        eq(bills.status, "unpaid"),
        gte(bills.dueDate, dateStr(start)),
        lt(bills.dueDate, dateStr(end)),
      ),
    );
  for (const b of bl) bump(b.at);

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

export type OverdueItem = {
  kind: "task" | "assignment";
  id: string;
  title: string;
  dueDate: string;
};

export async function getOverdueItems(
  userId: string,
  limit = 8,
  now = new Date(),
): Promise<OverdueItem[]> {
  const start = dayStartUTC(now);

  const tks = await db
    .select({ id: tasks.id, title: tasks.title, at: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        inArray(tasks.status, [...OPEN_TASK]),
        lt(tasks.dueDate, start),
      ),
    )
    .orderBy(asc(tasks.dueDate))
    .limit(limit);

  const asg = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      at: assignments.dueDate,
    })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        inArray(assignments.status, [...OPEN_ASSIGNMENT]),
        lt(assignments.dueDate, start),
      ),
    )
    .orderBy(asc(assignments.dueDate))
    .limit(limit);

  const merged: OverdueItem[] = [
    ...tks
      .filter((t) => t.at)
      .map((t) => ({
        kind: "task" as const,
        id: t.id,
        title: t.title,
        dueDate: t.at!.toISOString(),
      })),
    ...asg
      .filter((a) => a.at)
      .map((a) => ({
        kind: "assignment" as const,
        id: a.id,
        title: a.title,
        dueDate: a.at!.toISOString(),
      })),
  ];

  return merged
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, limit);
}
