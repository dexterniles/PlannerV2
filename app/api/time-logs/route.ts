import { collectionRoute } from "@/lib/server/crud-route";
import { createTimeLog, listTimeLogs } from "@/lib/server/data/time-logs";
import { createTimeLogSchema } from "@/lib/validations/supporting";

export const { GET, POST } = collectionRoute({
  list: (userId) => listTimeLogs(userId),
  create: createTimeLog,
  createSchema: createTimeLogSchema,
});
