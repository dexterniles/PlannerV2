import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { workspaces } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/lib/validations/workspaces";

const cols = {
  id: workspaces.id,
  name: workspaces.name,
  type: workspaces.type,
  color: workspaces.color,
  icon: workspaces.icon,
  sortOrder: workspaces.sortOrder,
  createdAt: workspaces.createdAt,
  updatedAt: workspaces.updatedAt,
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function guardConflict<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError("conflict", "A workspace with that name exists");
    }
    throw error;
  }
}

export async function listWorkspaces(userId: string) {
  return db
    .select(cols)
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(asc(workspaces.sortOrder));
}

export async function getWorkspace(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Workspace not found");
  return row;
}

export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
) {
  return guardConflict(async () => {
    const [row] = await db
      .insert(workspaces)
      .values({
        userId,
        name: input.name,
        type: input.type,
        color: input.color ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder,
      })
      .returning(cols);
    return row;
  });
}

export async function updateWorkspace(
  userId: string,
  id: string,
  input: UpdateWorkspaceInput,
) {
  await getWorkspace(userId, id);
  return guardConflict(async () => {
    const [row] = await db
      .update(workspaces)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .returning(cols);
    return row;
  });
}

export async function deleteWorkspace(userId: string, id: string) {
  await getWorkspace(userId, id);
  await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
}
