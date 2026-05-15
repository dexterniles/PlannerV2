import { and, desc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/validations/projects";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);

const projectColumns = {
  id: projects.id,
  workspaceId: projects.workspaceId,
  name: projects.name,
  description: projects.description,
  goal: projects.goal,
  status: projects.status,
  priority: projects.priority,
  startDate: projects.startDate,
  targetDate: projects.targetDate,
  color: projects.color,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export async function listProjects(userId: string) {
  return db
    .select(projectColumns)
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function getProject(userId: string, id: string) {
  const [row] = await db
    .select(projectColumns)
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Project not found");
  return row;
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
) {
  await assertOwns(userId, "workspace", input.workspaceId);
  const [row] = await db
    .insert(projects)
    .values({
      userId,
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description ?? null,
      goal: input.goal ?? null,
      status: input.status,
      priority: input.priority,
      startDate: dateStr(input.startDate),
      targetDate: dateStr(input.targetDate),
      color: input.color ?? null,
    })
    .returning(projectColumns);
  return row;
}

export async function updateProject(
  userId: string,
  id: string,
  input: UpdateProjectInput,
) {
  await getProject(userId, id);
  const { startDate, targetDate, ...rest } = input;
  const [row] = await db
    .update(projects)
    .set({
      ...rest,
      ...(startDate !== undefined ? { startDate: dateStr(startDate) } : {}),
      ...(targetDate !== undefined ? { targetDate: dateStr(targetDate) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning(projectColumns);
  return row;
}

export async function deleteProject(userId: string, id: string) {
  await getProject(userId, id);
  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
}
