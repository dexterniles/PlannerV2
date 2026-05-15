import { collectionRoute } from "@/lib/server/crud-route";
import { createEvent, listEvents } from "@/lib/server/data/events";
import { createEventSchema } from "@/lib/validations/events";

export const { GET, POST } = collectionRoute({
  list: (userId) => listEvents(userId),
  create: createEvent,
  createSchema: createEventSchema,
});
