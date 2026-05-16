import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { courses, events, workspaces } from "@/lib/db/schema";
import { materializeRecurrencesForUser } from "@/lib/server/recurrence-materialize";

export async function runAutoComplete(now: Date = new Date()) {
  const today = now.toISOString().slice(0, 10);

  const users = await db
    .selectDistinct({ userId: workspaces.userId })
    .from(workspaces);

  let materialized = 0;
  for (const { userId } of users) {
    const { inserted } = await materializeRecurrencesForUser(userId, now);
    materialized += inserted;
  }

  const completedCourses = await db
    .update(courses)
    .set({ status: "completed", updatedAt: now })
    .where(
      and(
        isNotNull(courses.endDate),
        lt(courses.endDate, today),
        inArray(courses.status, ["active", "planned"]),
      ),
    )
    .returning({ id: courses.id });

  const completedEvents = await db
    .update(events)
    .set({ status: "completed", updatedAt: now })
    .where(
      and(
        isNotNull(events.endsAt),
        lt(events.endsAt, now),
        eq(events.status, "confirmed"),
      ),
    )
    .returning({ id: events.id });

  return {
    users: users.length,
    materialized,
    completedCourses: completedCourses.length,
    completedEvents: completedEvents.length,
  };
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
