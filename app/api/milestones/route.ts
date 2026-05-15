import { HttpError } from "@/lib/server/api-response";
import { collectionRoute } from "@/lib/server/crud-route";
import { createMilestone, listMilestones } from "@/lib/server/data/milestones";
import { createMilestoneSchema } from "@/lib/validations/milestones";

export const { GET, POST } = collectionRoute({
  list: (userId, request) => {
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) {
      throw new HttpError("validation", "projectId is required");
    }
    return listMilestones(userId, projectId);
  },
  create: createMilestone,
  createSchema: createMilestoneSchema,
});
