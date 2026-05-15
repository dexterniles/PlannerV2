import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { billCategories } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api-response";
import type {
  CreateBillCategoryInput,
  UpdateBillCategoryInput,
} from "@/lib/validations/money";

const cols = {
  id: billCategories.id,
  name: billCategories.name,
  color: billCategories.color,
  sortOrder: billCategories.sortOrder,
  createdAt: billCategories.createdAt,
  updatedAt: billCategories.updatedAt,
};

export async function listBillCategories(userId: string) {
  return db
    .select(cols)
    .from(billCategories)
    .where(eq(billCategories.userId, userId))
    .orderBy(asc(billCategories.sortOrder));
}

export async function getBillCategory(userId: string, id: string) {
  const [row] = await db
    .select(cols)
    .from(billCategories)
    .where(and(eq(billCategories.id, id), eq(billCategories.userId, userId)))
    .limit(1);
  if (!row) throw new HttpError("not_found", "Category not found");
  return row;
}

export async function createBillCategory(
  userId: string,
  input: CreateBillCategoryInput,
) {
  const [row] = await db
    .insert(billCategories)
    .values({
      userId,
      name: input.name,
      color: input.color ?? null,
      sortOrder: input.sortOrder,
    })
    .returning(cols);
  return row;
}

export async function updateBillCategory(
  userId: string,
  id: string,
  input: UpdateBillCategoryInput,
) {
  await getBillCategory(userId, id);
  const [row] = await db
    .update(billCategories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(billCategories.id, id), eq(billCategories.userId, userId)))
    .returning(cols);
  return row;
}

export async function deleteBillCategory(userId: string, id: string) {
  await getBillCategory(userId, id);
  await db
    .delete(billCategories)
    .where(and(eq(billCategories.id, id), eq(billCategories.userId, userId)));
}
