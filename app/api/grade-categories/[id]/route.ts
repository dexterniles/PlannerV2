import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteGradeCategory,
  getGradeCategory,
  updateGradeCategory,
} from "@/lib/server/data/grade-categories";
import { updateGradeCategorySchema } from "@/lib/validations/grade-categories";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getGradeCategory,
  update: updateGradeCategory,
  remove: deleteGradeCategory,
  updateSchema: updateGradeCategorySchema,
});
