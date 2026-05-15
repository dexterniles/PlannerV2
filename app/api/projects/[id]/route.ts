import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/server/data/projects";
import { updateProjectSchema } from "@/lib/validations/projects";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getProject,
  update: updateProject,
  remove: deleteProject,
  updateSchema: updateProjectSchema,
});
