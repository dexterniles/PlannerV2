import { and, desc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { assignments } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "@/lib/validations/assignments";

const assignmentColumns = {
  id: assignments.id,
  courseId: assignments.courseId,
  title: assignments.title,
  description: assignments.description,
  dueDate: assignments.dueDate,
  categoryId: assignments.categoryId,
  status: assignments.status,
  pointsEarned: assignments.pointsEarned,
  pointsPossible: assignments.pointsPossible,
  notes: assignments.notes,
  recurrenceRuleId: assignments.recurrenceRuleId,
  createdAt: assignments.createdAt,
  updatedAt: assignments.updatedAt,
};

const money = (v: number | null | undefined) =>
  v == null ? null : v.toFixed(2);

export async function listAssignments(userId: string) {
  return db
    .select(assignmentColumns)
    .from(assignments)
    .where(eq(assignments.userId, userId))
    .orderBy(desc(assignments.createdAt));
}

export async function getAssignment(userId: string, id: string) {
  const [row] = await db
    .select(assignmentColumns)
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Assignment not found");
  return row;
}

export async function createAssignment(
  userId: string,
  input: CreateAssignmentInput,
) {
  await assertOwns(userId, "course", input.courseId);
  if (input.categoryId) {
    await assertOwns(userId, "grade_category", input.categoryId);
  }

  const [row] = await db
    .insert(assignments)
    .values({
      userId,
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      categoryId: input.categoryId ?? null,
      status: input.status,
      pointsEarned: money(input.pointsEarned),
      pointsPossible: money(input.pointsPossible),
      notes: input.notes ?? null,
      recurrenceRuleId: input.recurrenceRuleId ?? null,
    })
    .returning(assignmentColumns);
  return row;
}

export async function updateAssignment(
  userId: string,
  id: string,
  input: UpdateAssignmentInput,
) {
  await getAssignment(userId, id);
  if (input.categoryId) {
    await assertOwns(userId, "grade_category", input.categoryId);
  }

  const { pointsEarned, pointsPossible, ...rest } = input;
  const [row] = await db
    .update(assignments)
    .set({
      ...rest,
      ...(pointsEarned !== undefined ? { pointsEarned: money(pointsEarned) } : {}),
      ...(pointsPossible !== undefined
        ? { pointsPossible: money(pointsPossible) }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(assignments.id, id), eq(assignments.userId, userId)))
    .returning(assignmentColumns);
  return row;
}

export async function deleteAssignment(userId: string, id: string) {
  await getAssignment(userId, id);
  await db
    .delete(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.userId, userId)));
}
