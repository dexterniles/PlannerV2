import { collectionRoute } from "@/lib/server/crud-route";
import { createIncome, listIncome } from "@/lib/server/data/income";
import { createIncomeSchema } from "@/lib/validations/money";

export const { GET, POST } = collectionRoute({
  list: (userId) => listIncome(userId),
  create: createIncome,
  createSchema: createIncomeSchema,
});
