import { collectionRoute } from "@/lib/server/crud-route";
import { createRecurrenceRule } from "@/lib/server/data/recurrence-rules";
import { createRecurrenceRuleSchema } from "@/lib/validations/supporting";

// Recurrence rules are created in the context of an item and have no
// standalone per-user listing (no user_id column); GET returns empty.
export const { GET, POST } = collectionRoute({
  list: async () => [],
  create: createRecurrenceRule,
  createSchema: createRecurrenceRuleSchema,
});
