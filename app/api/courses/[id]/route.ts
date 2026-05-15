import { itemRoute } from "@/lib/server/crud-route";
import {
  deleteCourse,
  getCourse,
  updateCourse,
} from "@/lib/server/data/courses";
import { updateCourseSchema } from "@/lib/validations/courses";

export const { GET, PATCH, DELETE } = itemRoute({
  get: getCourse,
  update: updateCourse,
  remove: deleteCourse,
  updateSchema: updateCourseSchema,
});
