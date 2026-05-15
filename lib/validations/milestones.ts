import { z } from "zod";

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).nullish(),
  targetDate: z.coerce.date().nullish(),
  completedAt: z.coerce.date().nullish(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .partial()
  .omit({ projectId: true });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
