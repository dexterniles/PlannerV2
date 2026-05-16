import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
} from "@/lib/server/data/workspaces";
import { updateWorkspaceSchema } from "@/lib/validations/workspaces";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getWorkspace,
  update: updateWorkspace,
  remove: deleteWorkspace,
  updateSchema: updateWorkspaceSchema,
});
