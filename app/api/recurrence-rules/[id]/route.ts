import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteRecurrenceRule,
  getRecurrenceRule,
  updateRecurrenceRule,
} from "@/lib/server/data/recurrence-rules";
import { updateRecurrenceRuleSchema } from "@/lib/validations/supporting";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getRecurrenceRule,
  update: updateRecurrenceRule,
  remove: deleteRecurrenceRule,
  updateSchema: updateRecurrenceRuleSchema,
});
