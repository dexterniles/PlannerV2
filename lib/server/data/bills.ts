import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { assertOwns } from "@/lib/auth/ownership";
import { db } from "@/lib/db/client";
import { bills } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateBillInput,
  UpdateBillInput,
} from "@/lib/validations/money";

const dateStr = (d: Date | null | undefined) =>
  d == null ? null : d.toISOString().slice(0, 10);
const money = (n: number | null | undefined) =>
  n == null ? null : n.toFixed(2);

const cols = {
  id: bills.id,
  name: bills.name,
  description: bills.description,
  amount: bills.amount,
  categoryId: bills.categoryId,
  dueDate: bills.dueDate,
  status: bills.status,
  paidAt: bills.paidAt,
  paidAmount: bills.paidAmount,
  notes: bills.notes,
  color: bills.color,
  recurrenceRuleId: bills.recurrenceRuleId,
  createdAt: bills.createdAt,
  updatedAt: bills.updatedAt,
};

export async function listBills(userId: string) {
  return db
    .select(cols)
    .from(bills)
    .where(eq(bills.userId, userId))
    .orderBy(asc(bills.dueDate));
}

export async function listUpcomingBills(userId: string, days = 7) {
  const now = new Date();
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + days);
  return db
    .select(cols)
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        eq(bills.status, "unpaid"),
        gte(bills.dueDate, dateStr(now)!),
        lte(bills.dueDate, dateStr(end)!),
      ),
    )
    .orderBy(asc(bills.dueDate));
}

export async function getBill(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Bill not found");
  return row;
}

export async function createBill(userId: string, input: CreateBillInput) {
  if (input.categoryId) {
    await assertOwns(userId, "bill_category", input.categoryId);
  }
  const [row] = await db
    .insert(bills)
    .values({
      userId,
      name: input.name,
      description: input.description ?? null,
      amount: input.amount.toFixed(2),
      categoryId: input.categoryId ?? null,
      dueDate: dateStr(input.dueDate)!,
      status: input.status,
      paidAmount: money(input.paidAmount),
      notes: input.notes ?? null,
      color: input.color ?? null,
      recurrenceRuleId: input.recurrenceRuleId ?? null,
    })
    .returning(cols);
  return row;
}

export async function updateBill(
  userId: string,
  id: string,
  input: UpdateBillInput,
) {
  await getBill(userId, id);
  if (input.categoryId) {
    await assertOwns(userId, "bill_category", input.categoryId);
  }
  const { amount, paidAmount, dueDate, status, ...rest } = input;
  const [row] = await db
    .update(bills)
    .set({
      ...rest,
      ...(amount !== undefined ? { amount: amount.toFixed(2) } : {}),
      ...(paidAmount !== undefined ? { paidAmount: money(paidAmount) } : {}),
      ...(dueDate !== undefined ? { dueDate: dateStr(dueDate)! } : {}),
      ...(status !== undefined
        ? { status, paidAt: status === "paid" ? new Date() : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(bills.id, id), eq(bills.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteBill(userId: string, id: string) {
  await getBill(userId, id);
  await db.delete(bills).where(and(eq(bills.id, id), eq(bills.userId, userId)));
}

export async function bulkMarkPaid(userId: string, ids: string[]) {
  await db
    .update(bills)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bills.userId, userId), inArray(bills.id, ids)));
  return { updated: ids.length };
}
