import { and, desc, eq } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/validations/tasks";

const taskColumns = {
  id: tasks.id,
  projectId: tasks.projectId,
  parentTaskId: tasks.parentTaskId,
  title: tasks.title,
  description: tasks.description,
  dueDate: tasks.dueDate,
  status: tasks.status,
  priority: tasks.priority,
  notes: tasks.notes,
  recurrenceRuleId: tasks.recurrenceRuleId,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

export async function listTasks(userId: string) {
  return db
    .select(taskColumns)
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTask(userId: string, id: string) {
  const [row] = await db
    .select(taskColumns)
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Task not found");
  return row;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  if (input.projectId) await assertOwns(userId, "project", input.projectId);
  if (input.parentTaskId) await assertOwns(userId, "task", input.parentTaskId);

  const [row] = await db
    .insert(tasks)
    .values({
      userId,
      projectId: input.projectId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      status: input.status,
      priority: input.priority,
      notes: input.notes ?? null,
      recurrenceRuleId: input.recurrenceRuleId ?? null,
    })
    .returning(taskColumns);
  return row;
}

export async function updateTask(
  userId: string,
  id: string,
  input: UpdateTaskInput,
) {
  await getTask(userId, id);
  if (input.projectId) await assertOwns(userId, "project", input.projectId);
  if (input.parentTaskId) await assertOwns(userId, "task", input.parentTaskId);

  const [row] = await db
    .update(tasks)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning(taskColumns);
  return row;
}

export async function deleteTask(userId: string, id: string) {
  await getTask(userId, id);
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}
