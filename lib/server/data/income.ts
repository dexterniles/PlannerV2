import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { incomeEntries } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateIncomeInput,
  UpdateIncomeInput,
} from "@/lib/validations/money";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);

const cols = {
  id: incomeEntries.id,
  kind: incomeEntries.kind,
  receivedDate: incomeEntries.receivedDate,
  amount: incomeEntries.amount,
  source: incomeEntries.source,
  notes: incomeEntries.notes,
  createdAt: incomeEntries.createdAt,
  updatedAt: incomeEntries.updatedAt,
};

export async function listIncome(userId: string) {
  return db
    .select(cols)
    .from(incomeEntries)
    .where(eq(incomeEntries.userId, userId))
    .orderBy(desc(incomeEntries.receivedDate));
}

export async function getIncome(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(incomeEntries)
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Income entry not found");
  return row;
}

export async function createIncome(
  userId: string,
  input: CreateIncomeInput,
) {
  const [row] = await db
    .insert(incomeEntries)
    .values({
      userId,
      kind: input.kind,
      receivedDate: dateStr(input.receivedDate)!,
      amount: input.amount.toFixed(2),
      source: input.source ?? null,
      notes: input.notes ?? null,
    })
    .returning(cols);
  return row;
}

export async function updateIncome(
  userId: string,
  id: string,
  input: UpdateIncomeInput,
) {
  await getIncome(userId, id);
  const { amount, receivedDate, ...rest } = input;
  const [row] = await db
    .update(incomeEntries)
    .set({
      ...rest,
      ...(amount !== undefined ? { amount: amount.toFixed(2) } : {}),
      ...(receivedDate !== undefined
        ? { receivedDate: dateStr(receivedDate)! }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteIncome(userId: string, id: string) {
  await getIncome(userId, id);
  await db
    .delete(incomeEntries)
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)));
}
