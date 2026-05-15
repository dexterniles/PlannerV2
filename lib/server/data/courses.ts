import { and, desc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { courses } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateCourseInput,
  UpdateCourseInput,
} from "@/lib/validations/courses";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);
const num = (n: number | null | undefined) =>
  n == null ? null : n.toString();

const cols = {
  id: courses.id,
  workspaceId: courses.workspaceId,
  name: courses.name,
  code: courses.code,
  instructor: courses.instructor,
  semester: courses.semester,
  credits: courses.credits,
  color: courses.color,
  status: courses.status,
  startDate: courses.startDate,
  endDate: courses.endDate,
  syllabusFilePath: courses.syllabusFilePath,
  syllabusName: courses.syllabusName,
  syllabusUploadedAt: courses.syllabusUploadedAt,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
};

export async function listCourses(userId: string) {
  return db
    .select(cols)
    .from(courses)
    .where(eq(courses.userId, userId))
    .orderBy(desc(courses.createdAt));
}

export async function getCourse(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Course not found");
  return row;
}

export async function createCourse(
  userId: string,
  input: CreateCourseInput,
) {
  await assertOwns(userId, "workspace", input.workspaceId);
  const [row] = await db
    .insert(courses)
    .values({
      userId,
      workspaceId: input.workspaceId,
      name: input.name,
      code: input.code ?? null,
      instructor: input.instructor ?? null,
      semester: input.semester ?? null,
      credits: num(input.credits),
      color: input.color ?? null,
      status: input.status,
      startDate: dateStr(input.startDate),
      endDate: dateStr(input.endDate),
    })
    .returning(cols);
  return row;
}

export async function updateCourse(
  userId: string,
  id: string,
  input: UpdateCourseInput,
) {
  await getCourse(userId, id);
  const { startDate, endDate, credits, ...rest } = input;
  const [row] = await db
    .update(courses)
    .set({
      ...rest,
      ...(startDate !== undefined ? { startDate: dateStr(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: dateStr(endDate) } : {}),
      ...(credits !== undefined ? { credits: num(credits) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteCourse(userId: string, id: string) {
  await getCourse(userId, id);
  await db
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)));
}

export async function setCourseSyllabus(
  userId: string,
  id: string,
  filePath: string,
  fileName: string,
) {
  await getCourse(userId, id);
  await db
    .update(courses)
    .set({
      syllabusFilePath: filePath,
      syllabusName: fileName,
      syllabusUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(courses.id, id), eq(courses.userId, userId)));
}
