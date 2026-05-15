import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  assignments,
  bills,
  events,
  recurrenceRules,
  tasks,
} from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateRecurrenceRuleInput,
  UpdateRecurrenceRuleInput,
} from "@/lib/validations/supporting";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);

const cols = {
  id: recurrenceRules.id,
  frequency: recurrenceRules.frequency,
  interval: recurrenceRules.interval,
  daysOfWeek: recurrenceRules.daysOfWeek,
  endDate: recurrenceRules.endDate,
  count: recurrenceRules.count,
  createdAt: recurrenceRules.createdAt,
  updatedAt: recurrenceRules.updatedAt,
};

// A recurrence_rules row has no user_id. It is only reachable if referenced by
// a row the user owns — enforce that for every read/mutation (§7.3).
async function assertRuleOwned(userId: string, id: string) {
  const refs = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.recurrenceRuleId, id), eq(tasks.userId, userId)))
    .limit(1);
  if (refs.length) return;

  for (const [table, fk, uid] of [
    [assignments, assignments.recurrenceRuleId, assignments.userId],
    [events, events.recurrenceRuleId, events.userId],
    [bills, bills.recurrenceRuleId, bills.userId],
  ] as const) {
    const r = await db
      .select({ ok: uid })
      .from(table)
      .where(and(eq(fk, id), eq(uid, userId)))
      .limit(1);
    if (r.length) return;
  }
  throw new HttpError("not_found", "Recurrence rule not found");
}

export async function createRecurrenceRule(
  _userId: string,
  input: CreateRecurrenceRuleInput,
) {
  const [row] = await db
    .insert(recurrenceRules)
    .values({
      frequency: input.frequency,
      interval: input.interval,
      daysOfWeek: input.daysOfWeek ?? null,
      endDate: dateStr(input.endDate),
      count: input.count ?? null,
    })
    .returning(cols);
  return row;
}

export async function getRecurrenceRule(userId: string, id: string) {
  await assertRuleOwned(userId, id);
  const [row] = await db
    .select(cols)
    .from(recurrenceRules)
    .where(eq(recurrenceRules.id, id))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Recurrence rule not found");
  return row;
}

export async function updateRecurrenceRule(
  userId: string,
  id: string,
  input: UpdateRecurrenceRuleInput,
) {
  await assertRuleOwned(userId, id);
  const { endDate, ...rest } = input;
  const [row] = await db
    .update(recurrenceRules)
    .set({
      ...rest,
      ...(endDate !== undefined ? { endDate: dateStr(endDate) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(recurrenceRules.id, id))
    .returning(cols);
  return row;
}

export async function deleteRecurrenceRule(userId: string, id: string) {
  await assertRuleOwned(userId, id);
  await db.delete(recurrenceRules).where(eq(recurrenceRules.id, id));
}
