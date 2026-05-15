import { and, desc, eq, isNull } from "drizzle-orm";

import { assertOwns, type OwnableKind } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { timeLogs } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateTimeLogInput,
  UpdateTimeLogInput,
} from "@/lib/validations/supporting";

const cols = {
  id: timeLogs.id,
  loggableType: timeLogs.loggableType,
  loggableId: timeLogs.loggableId,
  startedAt: timeLogs.startedAt,
  endedAt: timeLogs.endedAt,
  durationSeconds: timeLogs.durationSeconds,
  wasPomodoro: timeLogs.wasPomodoro,
  pomodoroIntervalMinutes: timeLogs.pomodoroIntervalMinutes,
  notes: timeLogs.notes,
  createdAt: timeLogs.createdAt,
  updatedAt: timeLogs.updatedAt,
};

export async function listTimeLogs(userId: string) {
  return db
    .select(cols)
    .from(timeLogs)
    .where(eq(timeLogs.userId, userId))
    .orderBy(desc(timeLogs.startedAt));
}

export async function getActiveTimeLog(userId: string) {
  const [row] = await db
    .select(cols)
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)))
    .limit(1);
  return row ?? null;
}

export async function getTimeLog(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(timeLogs)
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Time log not found");
  return row;
}

function durationSeconds(started: Date, ended: Date) {
  return Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000));
}

export async function createTimeLog(
  userId: string,
  input: CreateTimeLogInput,
) {
  await assertOwns(userId, input.loggableType as OwnableKind, input.loggableId);

  return db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(timeLogs)
      .set({
        endedAt: now,
        updatedAt: now,
      })
      .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)));

    const [row] = await tx
      .insert(timeLogs)
      .values({
        userId,
        loggableType: input.loggableType,
        loggableId: input.loggableId,
        startedAt: input.startedAt,
        wasPomodoro: input.wasPomodoro,
        pomodoroIntervalMinutes: input.pomodoroIntervalMinutes ?? null,
        notes: input.notes ?? null,
      })
      .returning(cols);
    return row;
  });
}

export async function stopTimeLog(userId: string, id: string) {
  const log = await getTimeLog(userId, id);
  if (log.endedAt) return log;
  const ended = new Date();
  const [row] = await db
    .update(timeLogs)
    .set({
      endedAt: ended,
      durationSeconds: durationSeconds(log.startedAt, ended),
      updatedAt: ended,
    })
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)))
    .returning(cols);
  return row;
}

export async function updateTimeLog(
  userId: string,
  id: string,
  input: UpdateTimeLogInput,
) {
  await getTimeLog(userId, id);
  const [row] = await db
    .update(timeLogs)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteTimeLog(userId: string, id: string) {
  await getTimeLog(userId, id);
  await db
    .delete(timeLogs)
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)));
}
