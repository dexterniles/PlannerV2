import { collectionRoute } from "@/lib/server/crud-route";
import {
  createBillCategory,
  listBillCategories,
} from "@/lib/server/data/bill-categories";
import { createBillCategorySchema } from "@/lib/validations/money";

export const { GET, POST } = collectionRoute({
  list: (userId) => listBillCategories(userId),
  create: createBillCategory,
  createSchema: createBillCategorySchema,
});
