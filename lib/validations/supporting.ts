import { z } from "zod";

// Tags
export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().trim().min(1).nullish(),
});
export const updateTagSchema = createTagSchema.partial();
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

// Taggings
export const taggableTypeValues = [
  "course",
  "project",
  "assignment",
  "task",
  "event",
  "bill",
  "note",
] as const;
export const attachTaggingSchema = z.object({
  tagId: z.string().uuid(),
  taggableType: z.enum(taggableTypeValues),
  taggableId: z.string().uuid(),
});
export const detachTaggingSchema = attachTaggingSchema;
export type AttachTaggingInput = z.infer<typeof attachTaggingSchema>;

// Resources
export const resourceParentTypeValues = [
  "course",
  "project",
  "assignment",
  "task",
] as const;
export const resourceTypeValues = ["link", "file", "book_reference"] as const;
export const createResourceSchema = z.object({
  parentType: z.enum(resourceParentTypeValues),
  parentId: z.string().uuid(),
  type: z.enum(resourceTypeValues),
  title: z.string().trim().min(1).max(300).nullish(),
  url: z.string().trim().url().nullish(),
  filePath: z.string().trim().min(1).nullish(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const updateResourceSchema = createResourceSchema
  .partial()
  .omit({ parentType: true, parentId: true });
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

// Time logs
export const timeLogParentTypeValues = [
  "course",
  "project",
  "assignment",
  "task",
] as const;
export const createTimeLogSchema = z.object({
  loggableType: z.enum(timeLogParentTypeValues),
  loggableId: z.string().uuid(),
  startedAt: z.coerce.date().default(() => new Date()),
  wasPomodoro: z.boolean().default(false),
  pomodoroIntervalMinutes: z.number().int().positive().nullish(),
  notes: z.string().trim().min(1).nullish(),
});
export const updateTimeLogSchema = z.object({
  notes: z.string().trim().min(1).nullish(),
  endedAt: z.coerce.date().nullish(),
});
export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;

// Recurrence rules
export const recurrenceFrequencyValues = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
] as const;
export const createRecurrenceRuleSchema = z.object({
  frequency: z.enum(recurrenceFrequencyValues),
  interval: z.number().int().min(1).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).nullish(),
  endDate: z.coerce.date().nullish(),
  count: z.number().int().min(1).nullish(),
});
export const updateRecurrenceRuleSchema =
  createRecurrenceRuleSchema.partial();
export type CreateRecurrenceRuleInput = z.infer<
  typeof createRecurrenceRuleSchema
>;
export type UpdateRecurrenceRuleInput = z.infer<
  typeof updateRecurrenceRuleSchema
>;
