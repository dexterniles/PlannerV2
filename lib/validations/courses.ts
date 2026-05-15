import { z } from "zod";

export const courseStatusValues = [
  "planned",
  "active",
  "completed",
  "dropped",
] as const;

export const createCourseSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  code: z.string().trim().min(1).nullish(),
  instructor: z.string().trim().min(1).nullish(),
  semester: z.string().trim().min(1).nullish(),
  credits: z.number().min(0).max(99).nullish(),
  color: z.string().trim().min(1).nullish(),
  status: z.enum(courseStatusValues).default("planned"),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
});

export const updateCourseSchema = createCourseSchema
  .partial()
  .omit({ workspaceId: true });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
