import { z } from "zod";

export const assignmentStatusValues = [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
] as const;

export const createAssignmentSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).nullish(),
  dueDate: z.coerce.date().nullish(),
  categoryId: z.string().uuid().nullish(),
  status: z.enum(assignmentStatusValues).default("not_started"),
  pointsEarned: z.number().min(0).nullish(),
  pointsPossible: z.number().min(0).nullish(),
  notes: z.string().trim().min(1).nullish(),
  recurrenceRuleId: z.string().uuid().nullish(),
});

export const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .omit({ courseId: true });

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
