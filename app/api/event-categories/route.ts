import { collectionRoute } from "@/lib/server/crud-route";
import {
  createEventCategory,
  listEventCategories,
} from "@/lib/server/data/event-categories";
import { createEventCategorySchema } from "@/lib/validations/events";

export const { GET, POST } = collectionRoute({
  list: (userId) => listEventCategories(userId),
  create: createEventCategory,
  createSchema: createEventCategorySchema,
});
