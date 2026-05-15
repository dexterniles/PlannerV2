import { collectionRoute } from "@/lib/server/crud-route";
import { createCourse, listCourses } from "@/lib/server/data/courses";
import { createCourseSchema } from "@/lib/validations/courses";

export const { GET, POST } = collectionRoute({
  list: (userId) => listCourses(userId),
  create: createCourse,
  createSchema: createCourseSchema,
});
