import { and, asc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { courses, gradeCategories } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateGradeCategoryInput,
  UpdateGradeCategoryInput,
} from "@/lib/validations/grade-categories";

const cols = {
  id: gradeCategories.id,
  courseId: gradeCategories.courseId,
  name: gradeCategories.name,
  weight: gradeCategories.weight,
  dropLowestN: gradeCategories.dropLowestN,
  createdAt: gradeCategories.createdAt,
  updatedAt: gradeCategories.updatedAt,
};

export async function listGradeCategories(userId: string, courseId: string) {
  await assertOwns(userId, "course", courseId);
  return db
    .select(cols)
    .from(gradeCategories)
    .where(eq(gradeCategories.courseId, courseId))
    .orderBy(asc(gradeCategories.name));
}

export async function getGradeCategory(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(gradeCategories)
    .innerJoin(courses, eq(gradeCategories.courseId, courses.id))
    .where(and(eq(gradeCategories.id, id), eq(courses.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Grade category not found");
  return row;
}

export async function createGradeCategory(
  userId: string,
  input: CreateGradeCategoryInput,
) {
  await assertOwns(userId, "course", input.courseId);
  const [row] = await db
    .insert(gradeCategories)
    .values({
      courseId: input.courseId,
      name: input.name,
      weight: input.weight.toString(),
      dropLowestN: input.dropLowestN,
    })
    .returning(cols);
  return row;
}

export async function updateGradeCategory(
  userId: string,
  id: string,
  input: UpdateGradeCategoryInput,
) {
  await getGradeCategory(userId, id);
  const { weight, ...rest } = input;
  const [row] = await db
    .update(gradeCategories)
    .set({
      ...rest,
      ...(weight !== undefined ? { weight: weight.toString() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(gradeCategories.id, id))
    .returning(cols);
  return row;
}

export async function deleteGradeCategory(userId: string, id: string) {
  await getGradeCategory(userId, id);
  await db.delete(gradeCategories).where(eq(gradeCategories.id, id));
}
