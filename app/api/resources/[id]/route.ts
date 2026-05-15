import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteResource,
  getResource,
  updateResource,
} from "@/lib/server/data/resources";
import { updateResourceSchema } from "@/lib/validations/supporting";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getResource,
  update: updateResource,
  remove: deleteResource,
  updateSchema: updateResourceSchema,
});
