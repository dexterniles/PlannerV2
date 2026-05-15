import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { assignments, bills, events, tasks } from "@/lib/db/schema";

export type CalendarItem = {
  kind: "event" | "task" | "assignment" | "bill";
  id: string;
  title: string;
  date: string;
};

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

export async function getCalendarItems(
  userId: string,
  from: Date,
  to: Date,
): Promise<CalendarItem[]> {
  const out: CalendarItem[] = [];

  const evs = await db
    .select({ id: events.id, title: events.title, at: events.startsAt })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startsAt, from),
        lte(events.startsAt, to),
      ),
    );
  for (const e of evs)
    out.push({ kind: "event", id: e.id, title: e.title, date: e.at.toISOString() });

  const tks = await db
    .select({ id: tasks.id, title: tasks.title, at: tasks.dueDate })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, from),
        lte(tasks.dueDate, to),
      ),
    );
  for (const t of tks)
    if (t.at)
      out.push({ kind: "task", id: t.id, title: t.title, date: t.at.toISOString() });

  const asg = await db
    .select({ id: assignments.id, title: assignments.title, at: assignments.dueDate })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        gte(assignments.dueDate, from),
        lte(assignments.dueDate, to),
      ),
    );
  for (const a of asg)
    if (a.at)
      out.push({
        kind: "assignment",
        id: a.id,
        title: a.title,
        date: a.at.toISOString(),
      });

  const bl = await db
    .select({ id: bills.id, title: bills.name, at: bills.dueDate })
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        gte(bills.dueDate, dateStr(from)),
        lte(bills.dueDate, dateStr(to)),
      ),
    );
  for (const b of bl)
    out.push({ kind: "bill", id: b.id, title: b.title, date: b.at });

  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}
