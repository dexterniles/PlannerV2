import { collectionRoute } from "@/lib/server/crud-route";
import { createProject, listProjects } from "@/lib/server/data/projects";
import { createProjectSchema } from "@/lib/validations/projects";

export const { GET, POST } = collectionRoute({
  list: (userId) => listProjects(userId),
  create: createProject,
  createSchema: createProjectSchema,
});
