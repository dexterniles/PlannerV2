import { itemRoute } from "@/lib/server/crud-route";
import { deleteEvent, getEvent, updateEvent } from "@/lib/server/data/events";
import { updateEventSchema } from "@/lib/validations/events";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getEvent,
  update: updateEvent,
  remove: deleteEvent,
  updateSchema: updateEventSchema,
});
