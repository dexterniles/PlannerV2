import { z } from "zod";

export const createGradeCategorySchema = z.object({
  courseId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  weight: z.number().min(0).max(100),
  dropLowestN: z.number().int().min(0).default(0),
});

export const updateGradeCategorySchema = createGradeCategorySchema
  .partial()
  .omit({ courseId: true });

export type CreateGradeCategoryInput = z.infer<
  typeof createGradeCategorySchema
>;
export type UpdateGradeCategoryInput = z.infer<
  typeof updateGradeCategorySchema
>;
