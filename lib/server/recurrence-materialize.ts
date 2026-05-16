import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  assignments,
  bills,
  events,
  recurrenceRules,
  tasks,
} from "@/lib/db/schema";
import { planRecurrence, type RecurrenceRule } from "@/lib/server/recurrence";

const ruleCols = {
  rFrequency: recurrenceRules.frequency,
  rInterval: recurrenceRules.interval,
  rDaysOfWeek: recurrenceRules.daysOfWeek,
  rEndDate: recurrenceRules.endDate,
  rCount: recurrenceRules.count,
};

type RuleFields = {
  rFrequency: RecurrenceRule["frequency"];
  rInterval: number;
  rDaysOfWeek: number[] | null;
  rEndDate: string | null;
  rCount: number | null;
};

function toRule(r: RuleFields): RecurrenceRule {
  return {
    frequency: r.rFrequency,
    interval: r.rInterval,
    daysOfWeek: r.rDaysOfWeek,
    endDate: r.rEndDate ? new Date(`${r.rEndDate}T00:00:00.000Z`) : null,
    count: r.rCount,
  };
}

function groupByRule<T extends { recurrenceRuleId: string | null }>(
  rows: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.recurrenceRuleId) continue;
    const list = map.get(row.recurrenceRuleId) ?? [];
    list.push(row);
    map.set(row.recurrenceRuleId, list);
  }
  return map;
}

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function materializeTasks(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<number> {
  const rows = await tx
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      parentTaskId: tasks.parentTaskId,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      notes: tasks.notes,
      recurrenceRuleId: tasks.recurrenceRuleId,
      ...ruleCols,
    })
    .from(tasks)
    .innerJoin(recurrenceRules, eq(tasks.recurrenceRuleId, recurrenceRules.id))
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.dueDate)));

  let inserted = 0;
  for (const [ruleId, group] of groupByRule(rows)) {
    const dated = group
      .filter((g): g is typeof g & { dueDate: Date } => g.dueDate != null)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    if (dated.length === 0) continue;
    const anchor = dated[0];
    const occurrences = planRecurrence(
      dated.map((d) => ({ date: d.dueDate })),
      toRule(anchor),
      now,
    );
    for (const date of occurrences) {
      await tx.insert(tasks).values({
        userId,
        projectId: anchor.projectId,
        parentTaskId: anchor.parentTaskId,
        title: anchor.title,
        description: anchor.description,
        dueDate: date,
        status: "not_started",
        priority: anchor.priority,
        notes: anchor.notes,
        recurrenceRuleId: ruleId,
      });
      inserted++;
    }
  }
  return inserted;
}

async function materializeAssignments(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<number> {
  const rows = await tx
    .select({
      courseId: assignments.courseId,
      title: assignments.title,
      description: assignments.description,
      dueDate: assignments.dueDate,
      categoryId: assignments.categoryId,
      notes: assignments.notes,
      recurrenceRuleId: assignments.recurrenceRuleId,
      ...ruleCols,
    })
    .from(assignments)
    .innerJoin(
      recurrenceRules,
      eq(assignments.recurrenceRuleId, recurrenceRules.id),
    )
    .where(
      and(eq(assignments.userId, userId), isNotNull(assignments.dueDate)),
    );

  let inserted = 0;
  for (const [ruleId, group] of groupByRule(rows)) {
    const dated = group
      .filter((g): g is typeof g & { dueDate: Date } => g.dueDate != null)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    if (dated.length === 0) continue;
    const anchor = dated[0];
    const occurrences = planRecurrence(
      dated.map((d) => ({ date: d.dueDate })),
      toRule(anchor),
      now,
    );
    for (const date of occurrences) {
      await tx.insert(assignments).values({
        userId,
        courseId: anchor.courseId,
        title: anchor.title,
        description: anchor.description,
        dueDate: date,
        categoryId: anchor.categoryId,
        status: "not_started",
        notes: anchor.notes,
        recurrenceRuleId: ruleId,
      });
      inserted++;
    }
  }
  return inserted;
}

async function materializeEvents(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<number> {
  const rows = await tx
    .select({
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
      ...ruleCols,
    })
    .from(events)
    .innerJoin(
      recurrenceRules,
      eq(events.recurrenceRuleId, recurrenceRules.id),
    )
    .where(eq(events.userId, userId));

  let inserted = 0;
  for (const [ruleId, group] of groupByRule(rows)) {
    const dated = group.sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
    const anchor = dated[0];
    const durationMs =
      anchor.endsAt != null
        ? anchor.endsAt.getTime() - anchor.startsAt.getTime()
        : null;
    const occurrences = planRecurrence(
      dated.map((d) => ({ date: d.startsAt })),
      toRule(anchor),
      now,
    );
    for (const date of occurrences) {
      await tx.insert(events).values({
        userId,
        title: anchor.title,
        description: anchor.description,
        categoryId: anchor.categoryId,
        startsAt: date,
        endsAt:
          durationMs != null ? new Date(date.getTime() + durationMs) : null,
        allDay: anchor.allDay,
        location: anchor.location,
        url: anchor.url,
        attendees: anchor.attendees,
        status: "confirmed",
        color: anchor.color,
        recurrenceRuleId: ruleId,
      });
      inserted++;
    }
  }
  return inserted;
}

async function materializeBills(
  tx: Tx,
  userId: string,
  now: Date,
): Promise<number> {
  const rows = await tx
    .select({
      name: bills.name,
      description: bills.description,
      amount: bills.amount,
      categoryId: bills.categoryId,
      dueDate: bills.dueDate,
      notes: bills.notes,
      color: bills.color,
      recurrenceRuleId: bills.recurrenceRuleId,
      ...ruleCols,
    })
    .from(bills)
    .innerJoin(recurrenceRules, eq(bills.recurrenceRuleId, recurrenceRules.id))
    .where(eq(bills.userId, userId));

  let inserted = 0;
  for (const [ruleId, group] of groupByRule(rows)) {
    const dated = group
      .map((g) => ({
        ...g,
        date: new Date(`${g.dueDate}T00:00:00.000Z`),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const anchor = dated[0];
    const occurrences = planRecurrence(
      dated.map((d) => ({ date: d.date })),
      toRule(anchor),
      now,
    );
    for (const date of occurrences) {
      await tx.insert(bills).values({
        userId,
        name: anchor.name,
        description: anchor.description,
        amount: anchor.amount,
        categoryId: anchor.categoryId,
        dueDate: dateOnly(date),
        status: "unpaid",
        notes: anchor.notes,
        color: anchor.color,
        recurrenceRuleId: ruleId,
      });
      inserted++;
    }
  }
  return inserted;
}

export async function materializeRecurrencesForUser(
  userId: string,
  now: Date = new Date(),
): Promise<{ inserted: number }> {
  return db.transaction(async (tx) => {
    const inserted =
      (await materializeTasks(tx, userId, now)) +
      (await materializeAssignments(tx, userId, now)) +
      (await materializeEvents(tx, userId, now)) +
      (await materializeBills(tx, userId, now));
    return { inserted };
  });
}
