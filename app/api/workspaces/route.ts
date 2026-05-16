import { collectionRoute } from "@/lib/server/crud-route";
import {
  createWorkspace,
  listWorkspaces,
} from "@/lib/server/data/workspaces";
import { createWorkspaceSchema } from "@/lib/validations/workspaces";

export const { GET, POST } = collectionRoute({
  list: (userId) => listWorkspaces(userId),
  create: createWorkspace,
  createSchema: createWorkspaceSchema,
});
