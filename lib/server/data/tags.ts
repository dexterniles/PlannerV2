import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { tags } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations/supporting";

const cols = {
  id: tags.id,
  name: tags.name,
  color: tags.color,
  createdAt: tags.createdAt,
  updatedAt: tags.updatedAt,
};

export async function listTags(userId: string) {
  return db
    .select(cols)
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.name));
}

export async function getTag(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Tag not found");
  return row;
}

export async function createTag(userId: string, input: CreateTagInput) {
  const [row] = await db
    .insert(tags)
    .values({ userId, name: input.name, color: input.color ?? null })
    .returning(cols);
  return row;
}

export async function updateTag(
  userId: string,
  id: string,
  input: UpdateTagInput,
) {
  await getTag(userId, id);
  const [row] = await db
    .update(tags)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteTag(userId: string, id: string) {
  await getTag(userId, id);
  await db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
}
