import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { eventCategories } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateEventCategoryInput,
  UpdateEventCategoryInput,
} from "@/lib/validations/events";

const cols = {
  id: eventCategories.id,
  name: eventCategories.name,
  color: eventCategories.color,
  sortOrder: eventCategories.sortOrder,
  createdAt: eventCategories.createdAt,
  updatedAt: eventCategories.updatedAt,
};

export async function listEventCategories(userId: string) {
  return db
    .select(cols)
    .from(eventCategories)
    .where(eq(eventCategories.userId, userId))
    .orderBy(asc(eventCategories.sortOrder));
}

export async function getEventCategory(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(eventCategories)
    .where(and(eq(eventCategories.id, id), eq(eventCategories.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Category not found");
  return row;
}

export async function createEventCategory(
  userId: string,
  input: CreateEventCategoryInput,
) {
  const [row] = await db
    .insert(eventCategories)
    .values({
      userId,
      name: input.name,
      color: input.color ?? null,
      sortOrder: input.sortOrder,
    })
    .returning(cols);
  return row;
}

export async function updateEventCategory(
  userId: string,
  id: string,
  input: UpdateEventCategoryInput,
) {
  await getEventCategory(userId, id);
  const [row] = await db
    .update(eventCategories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(eventCategories.id, id), eq(eventCategories.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteEventCategory(userId: string, id: string) {
  await getEventCategory(userId, id);
  await db
    .delete(eventCategories)
    .where(and(eq(eventCategories.id, id), eq(eventCategories.userId, userId)));
}
