import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteMilestone,
  getMilestone,
  updateMilestone,
} from "@/lib/server/data/milestones";
import { updateMilestoneSchema } from "@/lib/validations/milestones";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getMilestone,
  update: updateMilestone,
  remove: deleteMilestone,
  updateSchema: updateMilestoneSchema,
});
