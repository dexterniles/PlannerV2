import { and, asc, eq, gte, lte } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { events } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/lib/validations/events";

const cols = {
  id: events.id,
  title: events.title,
  description: events.description,
  categoryId: events.categoryId,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  allDay: events.allDay,
  location: events.location,
  url: events.url,
  attendees: events.attendees,
  status: events.status,
  color: events.color,
  recurrenceRuleId: events.recurrenceRuleId,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
};

export async function listEvents(userId: string) {
  return db
    .select(cols)
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(asc(events.startsAt));
}

export async function listUpcomingEvents(userId: string, limit = 5) {
  return db
    .select(cols)
    .from(events)
    .where(and(eq(events.userId, userId), gte(events.startsAt, new Date())))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function listEventsByDate(userId: string, date: Date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return db
    .select(cols)
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        gte(events.startsAt, start),
        lte(events.startsAt, end),
      ),
    )
    .orderBy(asc(events.startsAt));
}

export async function getEvent(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Event not found");
  return row;
}

export async function createEvent(userId: string, input: CreateEventInput) {
  if (input.categoryId) {
    await assertOwns(userId, "event_category", input.categoryId);
  }
  const [row] = await db
    .insert(events)
    .values({
      userId,
      title: input.title,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      allDay: input.allDay,
      location: input.location ?? null,
      url: input.url ?? null,
      attendees: input.attendees ?? null,
      status: input.status,
      color: input.color ?? null,
      recurrenceRuleId: input.recurrenceRuleId ?? null,
    })
    .returning(cols);
  return row;
}

export async function updateEvent(
  userId: string,
  id: string,
  input: UpdateEventInput,
) {
  await getEvent(userId, id);
  if (input.categoryId) {
    await assertOwns(userId, "event_category", input.categoryId);
  }
  const [row] = await db
    .update(events)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteEvent(userId: string, id: string) {
  await getEvent(userId, id);
  await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
}
