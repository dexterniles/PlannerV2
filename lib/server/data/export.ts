import { eq } from "drizzle-orm";

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
  taggings,
  tags,
  tasks,
  timeLogs,
  workspaces,
} from "@/lib/db/schema";

export async function exportUserData(userId: string) {
  const [
    ws,
    crs,
    asg,
    prj,
    tsk,
    evtCat,
    evt,
    blCat,
    bl,
    pay,
    nts,
    res,
    tg,
    tl,
    inc,
  ] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.userId, userId)),
    db.select().from(courses).where(eq(courses.userId, userId)),
    db.select().from(assignments).where(eq(assignments.userId, userId)),
    db.select().from(projects).where(eq(projects.userId, userId)),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db
      .select()
      .from(eventCategories)
      .where(eq(eventCategories.userId, userId)),
    db.select().from(events).where(eq(events.userId, userId)),
    db.select().from(billCategories).where(eq(billCategories.userId, userId)),
    db.select().from(bills).where(eq(bills.userId, userId)),
    db.select().from(paySchedule).where(eq(paySchedule.userId, userId)),
    db.select().from(notes).where(eq(notes.userId, userId)),
    db.select().from(resources).where(eq(resources.userId, userId)),
    db.select().from(tags).where(eq(tags.userId, userId)),
    db.select().from(timeLogs).where(eq(timeLogs.userId, userId)),
    db.select().from(incomeEntries).where(eq(incomeEntries.userId, userId)),
  ]);

  const courseIds = crs.map((c) => c.id);
  const projectIds = prj.map((p) => p.id);
  const tagIds = tg.map((t) => t.id);

  const gradeCats = courseIds.length
    ? await db.select().from(gradeCategories)
    : [];
  const mls = projectIds.length ? await db.select().from(milestones) : [];
  const tggs = tagIds.length ? await db.select().from(taggings) : [];

  return {
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      workspaces: ws,
      courses: crs,
      gradeCategories: gradeCats.filter((g) =>
        courseIds.includes(g.courseId),
      ),
      assignments: asg,
      projects: prj,
      tasks: tsk,
      milestones: mls.filter((m) => projectIds.includes(m.projectId)),
      eventCategories: evtCat,
      events: evt,
      billCategories: blCat,
      bills: bl,
      paySchedule: pay,
      notes: nts,
      resources: res,
      tags: tg,
      taggings: tggs.filter((t) => tagIds.includes(t.tagId)),
      timeLogs: tl,
      incomeEntries: inc,
    },
  };
}
