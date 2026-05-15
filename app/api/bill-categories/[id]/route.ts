import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteBillCategory,
  getBillCategory,
  updateBillCategory,
} from "@/lib/server/data/bill-categories";
import { updateBillCategorySchema } from "@/lib/validations/money";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getBillCategory,
  update: updateBillCategory,
  remove: deleteBillCategory,
  updateSchema: updateBillCategorySchema,
});
