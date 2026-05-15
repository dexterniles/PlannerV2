import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteTimeLog,
  getTimeLog,
  updateTimeLog,
} from "@/lib/server/data/time-logs";
import { updateTimeLogSchema } from "@/lib/validations/supporting";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getTimeLog,
  update: updateTimeLog,
  remove: deleteTimeLog,
  updateSchema: updateTimeLogSchema,
});
