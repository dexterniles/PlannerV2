import { and, eq, ilike } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  assignments,
  bills,
  courses,
  events,
  notes,
  projects,
  tasks,
} from "@/lib/db/schema";

export type SearchResult = {
  kind: "task" | "assignment" | "project" | "course" | "event" | "bill" | "note";
  id: string;
  title: string;
};

const PER = 6;

export async function search(
  userId: string,
  q: string,
): Promise<SearchResult[]> {
  const term = `%${q}%`;
  const [tk, asg, prj, crs, evt, bl, nt] = await Promise.all([
    db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), ilike(tasks.title, term)))
      .limit(PER),
    db
      .select({ id: assignments.id, title: assignments.title })
      .from(assignments)
      .where(
        and(eq(assignments.userId, userId), ilike(assignments.title, term)),
      )
      .limit(PER),
    db
      .select({ id: projects.id, title: projects.name })
      .from(projects)
      .where(and(eq(projects.userId, userId), ilike(projects.name, term)))
      .limit(PER),
    db
      .select({ id: courses.id, title: courses.name })
      .from(courses)
      .where(and(eq(courses.userId, userId), ilike(courses.name, term)))
      .limit(PER),
    db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(and(eq(events.userId, userId), ilike(events.title, term)))
      .limit(PER),
    db
      .select({ id: bills.id, title: bills.name })
      .from(bills)
      .where(and(eq(bills.userId, userId), ilike(bills.name, term)))
      .limit(PER),
    db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(and(eq(notes.userId, userId), ilike(notes.title, term)))
      .limit(PER),
  ]);

  const out: SearchResult[] = [];
  for (const r of tk) out.push({ kind: "task", ...r });
  for (const r of asg) out.push({ kind: "assignment", ...r });
  for (const r of prj) out.push({ kind: "project", ...r });
  for (const r of crs) out.push({ kind: "course", ...r });
  for (const r of evt) out.push({ kind: "event", ...r });
  for (const r of bl) out.push({ kind: "bill", ...r });
  for (const r of nt)
    out.push({ kind: "note", id: r.id, title: r.title ?? "Untitled" });
  return out;
}
