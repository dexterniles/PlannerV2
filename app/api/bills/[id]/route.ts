import { itemRoute } from "@/lib/server/crud-route";
import { deleteBill, getBill, updateBill } from "@/lib/server/data/bills";
import { updateBillSchema } from "@/lib/validations/money";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getBill,
  update: updateBill,
  remove: deleteBill,
  updateSchema: updateBillSchema,
});
