import { HttpError } from "@/lib/server/api-response";
import { collectionRoute } from "@/lib/server/crud-route";
import {
  createGradeCategory,
  listGradeCategories,
} from "@/lib/server/data/grade-categories";
import { createGradeCategorySchema } from "@/lib/validations/grade-categories";

export const { GET, POST } = collectionRoute({
  list: (userId, request) => {
    const courseId = new URL(request.url).searchParams.get("courseId");
    if (!courseId) throw new HttpError("validation", "courseId is required");
    return listGradeCategories(userId, courseId);
  },
  create: createGradeCategory,
  createSchema: createGradeCategorySchema,
});
