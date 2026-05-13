import { and, eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { db } from "@/lib/db/client";
import {
  assignments,
  billCategories,
  bills,
  courses,
  eventCategories,
  events,
  gradeCategories,
  incomeEntries,
  milestones,
  notes,
  paySchedule,
  projects,
  resources,
  tags,
  tasks,
  timeLogs,
  workspaces,
} from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";

export type DirectOwnable =
  | "workspace"
  | "course"
  | "assignment"
  | "project"
  | "task"
  | "event"
  | "event_category"
  | "bill"
  | "bill_category"
  | "pay_schedule"
  | "note"
  | "resource"
  | "tag"
  | "time_log"
  | "income_entry";

export type ChildOwnable = "grade_category" | "milestone";

export type OwnableKind = DirectOwnable | ChildOwnable;

const directTables: Record<DirectOwnable, { table: PgTable; userIdCol: unknown; idCol: unknown }> = {
  workspace: { table: workspaces, userIdCol: workspaces.userId, idCol: workspaces.id },
  course: { table: courses, userIdCol: courses.userId, idCol: courses.id },
  assignment: { table: assignments, userIdCol: assignments.userId, idCol: assignments.id },
  project: { table: projects, userIdCol: projects.userId, idCol: projects.id },
  task: { table: tasks, userIdCol: tasks.userId, idCol: tasks.id },
  event: { table: events, userIdCol: events.userId, idCol: events.id },
  event_category: {
    table: eventCategories,
    userIdCol: eventCategories.userId,
    idCol: eventCategories.id,
  },
  bill: { table: bills, userIdCol: bills.userId, idCol: bills.id },
  bill_category: {
    table: billCategories,
    userIdCol: billCategories.userId,
    idCol: billCategories.id,
  },
  pay_schedule: { table: paySchedule, userIdCol: paySchedule.userId, idCol: paySchedule.id },
  note: { table: notes, userIdCol: notes.userId, idCol: notes.id },
  resource: { table: resources, userIdCol: resources.userId, idCol: resources.id },
  tag: { table: tags, userIdCol: tags.userId, idCol: tags.id },
  time_log: { table: timeLogs, userIdCol: timeLogs.userId, idCol: timeLogs.id },
  income_entry: {
    table: incomeEntries,
    userIdCol: incomeEntries.userId,
    idCol: incomeEntries.id,
  },
};

export async function ownsThing(
  userId: string,
  kind: OwnableKind,
  id: string,
): Promise<boolean> {
  if (kind === "grade_category") {
    const row = await db
      .select({ ok: courses.userId })
      .from(gradeCategories)
      .innerJoin(courses, eq(gradeCategories.courseId, courses.id))
      .where(and(eq(gradeCategories.id, id), eq(courses.userId, userId)))
      .limit(1);
    return row.length > 0;
  }

  if (kind === "milestone") {
    const row = await db
      .select({ ok: projects.userId })
      .from(milestones)
      .innerJoin(projects, eq(milestones.projectId, projects.id))
      .where(and(eq(milestones.id, id), eq(projects.userId, userId)))
      .limit(1);
    return row.length > 0;
  }

  const entry = directTables[kind];
  const row = await db
    .select({ id: entry.idCol as never })
    .from(entry.table)
    .where(
      and(eq(entry.idCol as never, id), eq(entry.userIdCol as never, userId)),
    )
    .limit(1);
  return row.length > 0;
}

export async function assertOwns(
  userId: string,
  kind: OwnableKind,
  id: string,
): Promise<void> {
  const ok = await ownsThing(userId, kind, id);
  if (!ok) throw new HttpError("not_found", "Not found");
}
