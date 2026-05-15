import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteIncome,
  getIncome,
  updateIncome,
} from "@/lib/server/data/income";
import { updateIncomeSchema } from "@/lib/validations/money";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getIncome,
  update: updateIncome,
  remove: deleteIncome,
  updateSchema: updateIncomeSchema,
});
