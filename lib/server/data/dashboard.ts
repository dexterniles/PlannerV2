import { and, asc, eq, gte, isNull, lt, lte, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  assignments,
  bills,
  courses,
  events,
  incomeEntries,
  projects,
  tasks,
  timeLogs,
} from "@/lib/db/schema";

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

function dayBounds(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const { start: dayStart, end: dayEnd } = dayBounds(now);
  const weekEnd = new Date(dayStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const count = (v: unknown) => sql<number>`cast(count(${v}) as int)`;

  const [taskOverdue] = await db
    .select({ n: count(tasks.id) })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        lt(tasks.dueDate, dayStart),
        ne(tasks.status, "done"),
        ne(tasks.status, "cancelled"),
      ),
    );
  const [asgOverdue] = await db
    .select({ n: count(assignments.id) })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        lt(assignments.dueDate, dayStart),
        ne(assignments.status, "submitted"),
        ne(assignments.status, "graded"),
      ),
    );

  const [taskToday] = await db
    .select({ n: count(tasks.id) })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, dayStart),
        lt(tasks.dueDate, dayEnd),
      ),
    );
  const [asgToday] = await db
    .select({ n: count(assignments.id) })
    .from(assignments)
    .where(
      and(
        eq(assignments.userId, userId),
        gte(assignments.dueDate, dayStart),
        lt(assignments.dueDate, dayEnd),
      ),
    );

  const [activeTimer] = await db
    .select({
      id: timeLogs.id,
      loggableType: timeLogs.loggableType,
      loggableId: timeLogs.loggableId,
      startedAt: timeLogs.startedAt,
    })
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)))
    .limit(1);

  const [billsWeek] = await db
    .select({
      n: count(bills.id),
      sum: sql<string>`coalesce(sum(${bills.amount}), 0)`,
    })
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        eq(bills.status, "unpaid"),
        gte(bills.dueDate, dateStr(dayStart)),
        lte(bills.dueDate, dateStr(weekEnd)),
      ),
    );

  const [eventsToday] = await db
    .select({ n: count(events.id) })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startsAt, dayStart),
        lt(events.startsAt, dayEnd),
      ),
    );

  const [incomeMonth] = await db
    .select({ sum: sql<string>`coalesce(sum(${incomeEntries.amount}), 0)` })
    .from(incomeEntries)
    .where(
      and(
        eq(incomeEntries.userId, userId),
        gte(incomeEntries.receivedDate, dateStr(monthStart)),
        lt(incomeEntries.receivedDate, dateStr(monthEnd)),
      ),
    );
  const [billsMonth] = await db
    .select({ sum: sql<string>`coalesce(sum(${bills.amount}), 0)` })
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        gte(bills.dueDate, dateStr(monthStart)),
        lt(bills.dueDate, dateStr(monthEnd)),
      ),
    );

  const activeProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.status, "active")))
    .orderBy(asc(projects.createdAt))
    .limit(3);

  const projectProgress = [];
  for (const p of activeProjects) {
    const [agg] = await db
      .select({
        total: count(tasks.id),
        done: sql<number>`cast(count(*) filter (where ${tasks.status} = 'done') as int)`,
      })
      .from(tasks)
      .where(eq(tasks.projectId, p.id));
    const total = agg?.total ?? 0;
    projectProgress.push({
      id: p.id,
      name: p.name,
      total,
      done: agg?.done ?? 0,
      percent: total ? Math.round(((agg?.done ?? 0) / total) * 100) : 0,
    });
  }

  const upcomingEvents = await db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
    })
    .from(events)
    .where(and(eq(events.userId, userId), gte(events.startsAt, now)))
    .orderBy(asc(events.startsAt))
    .limit(5);

  return {
    overdue: (taskOverdue?.n ?? 0) + (asgOverdue?.n ?? 0),
    dueToday: (taskToday?.n ?? 0) + (asgToday?.n ?? 0),
    activeTimer: activeTimer ?? null,
    billsThisWeek: {
      count: billsWeek?.n ?? 0,
      sum: Number(billsWeek?.sum ?? 0),
    },
    eventsToday: eventsToday?.n ?? 0,
    monthMoney: {
      in: Number(incomeMonth?.sum ?? 0),
      out: Number(billsMonth?.sum ?? 0),
    },
    projectProgress,
    upcomingEvents: upcomingEvents.map((e) => ({
      ...e,
      startsAt: e.startsAt.toISOString(),
    })),
  };
}

export async function getDashboardGrades(userId: string) {
  const rows = await db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      earned: sql<string>`coalesce(sum(${assignments.pointsEarned}), 0)`,
      possible: sql<string>`coalesce(sum(${assignments.pointsPossible}), 0)`,
    })
    .from(courses)
    .leftJoin(
      assignments,
      and(
        eq(assignments.courseId, courses.id),
        eq(assignments.status, "graded"),
      ),
    )
    .where(eq(courses.userId, userId))
    .groupBy(courses.id, courses.name)
    .orderBy(asc(courses.name));

  return rows.map((r) => {
    const earned = Number(r.earned);
    const possible = Number(r.possible);
    return {
      courseId: r.courseId,
      courseName: r.courseName,
      earned,
      possible,
      percent: possible ? Math.round((earned / possible) * 100) : null,
    };
  });
}
