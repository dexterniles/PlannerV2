import { collectionRoute } from "@/lib/server/crud-route";
import { createBill, listBills } from "@/lib/server/data/bills";
import { createBillSchema } from "@/lib/validations/money";

export const { GET, POST } = collectionRoute({
  list: (userId) => listBills(userId),
  create: createBill,
  createSchema: createBillSchema,
});
