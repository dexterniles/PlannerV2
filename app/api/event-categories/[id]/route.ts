import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteEventCategory,
  getEventCategory,
  updateEventCategory,
} from "@/lib/server/data/event-categories";
import { updateEventCategorySchema } from "@/lib/validations/events";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getEventCategory,
  update: updateEventCategory,
  remove: deleteEventCategory,
  updateSchema: updateEventCategorySchema,
});
