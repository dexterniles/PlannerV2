import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { paySchedule } from "@/lib/db/schema";
import type { PutPayScheduleInput } from "@/lib/validations/money";

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

const cols = {
  id: paySchedule.id,
  frequency: paySchedule.frequency,
  referenceDate: paySchedule.referenceDate,
  createdAt: paySchedule.createdAt,
  updatedAt: paySchedule.updatedAt,
};

export async function getPaySchedule(userId: string) {
  const [row] = await db
    .select(cols)
    .from(paySchedule)
    .where(eq(paySchedule.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function putPaySchedule(
  userId: string,
  input: PutPayScheduleInput,
) {
  const existing = await getPaySchedule(userId);
  if (existing) {
    const [row] = await db
      .update(paySchedule)
      .set({
        frequency: input.frequency,
        referenceDate: dateStr(input.referenceDate),
        updatedAt: new Date(),
      })
      .where(eq(paySchedule.userId, userId))
      .returning(cols);
    return row;
  }
  const [row] = await db
    .insert(paySchedule)
    .values({
      userId,
      frequency: input.frequency,
      referenceDate: dateStr(input.referenceDate),
    })
    .returning(cols);
  return row;
}
