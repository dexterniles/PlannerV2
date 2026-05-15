import { and, asc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { milestones, projects } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/validations/milestones";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);

const cols = {
  id: milestones.id,
  projectId: milestones.projectId,
  title: milestones.title,
  description: milestones.description,
  targetDate: milestones.targetDate,
  completedAt: milestones.completedAt,
  createdAt: milestones.createdAt,
  updatedAt: milestones.updatedAt,
};

export async function listMilestones(userId: string, projectId: string) {
  await assertOwns(userId, "project", projectId);
  return db
    .select(cols)
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.targetDate));
}

export async function getMilestone(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(eq(milestones.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Milestone not found");
  return row;
}

export async function createMilestone(
  userId: string,
  input: CreateMilestoneInput,
) {
  await assertOwns(userId, "project", input.projectId);
  const [row] = await db
    .insert(milestones)
    .values({
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      targetDate: dateStr(input.targetDate),
      completedAt: input.completedAt ?? null,
    })
    .returning(cols);
  return row;
}

export async function updateMilestone(
  userId: string,
  id: string,
  input: UpdateMilestoneInput,
) {
  await getMilestone(userId, id);
  const { targetDate, ...rest } = input;
  const [row] = await db
    .update(milestones)
    .set({
      ...rest,
      ...(targetDate !== undefined ? { targetDate: dateStr(targetDate) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, id))
    .returning(cols);
  return row;
}

export async function deleteMilestone(userId: string, id: string) {
  await getMilestone(userId, id);
  await db.delete(milestones).where(eq(milestones.id, id));
}
