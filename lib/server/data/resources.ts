import { and, desc, eq } from "drizzle-orm";

import { assertOwns, type OwnableKind } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { resources } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateResourceInput,
  UpdateResourceInput,
} from "@/lib/validations/supporting";

const cols = {
  id: resources.id,
  parentType: resources.parentType,
  parentId: resources.parentId,
  type: resources.type,
  title: resources.title,
  url: resources.url,
  filePath: resources.filePath,
  metadata: resources.metadata,
  createdAt: resources.createdAt,
  updatedAt: resources.updatedAt,
};

export async function listResources(
  userId: string,
  parentType: string,
  parentId: string,
) {
  await assertOwns(userId, parentType as OwnableKind, parentId);
  return db
    .select(cols)
    .from(resources)
    .where(
      and(
        eq(resources.userId, userId),
        eq(resources.parentType, parentType as CreateResourceInput["parentType"]),
        eq(resources.parentId, parentId),
      ),
    )
    .orderBy(desc(resources.createdAt));
}

export async function getResource(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Resource not found");
  return row;
}

export async function createResource(
  userId: string,
  input: CreateResourceInput,
) {
  await assertOwns(userId, input.parentType as OwnableKind, input.parentId);
  const [row] = await db
    .insert(resources)
    .values({
      userId,
      parentType: input.parentType,
      parentId: input.parentId,
      type: input.type,
      title: input.title ?? null,
      url: input.url ?? null,
      filePath: input.filePath ?? null,
      metadata: input.metadata,
    })
    .returning(cols);
  return row;
}

export async function updateResource(
  userId: string,
  id: string,
  input: UpdateResourceInput,
) {
  await getResource(userId, id);
  const [row] = await db
    .update(resources)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(resources.id, id), eq(resources.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteResource(userId: string, id: string) {
  await getResource(userId, id);
  await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, userId)));
}
