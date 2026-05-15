import { z } from "zod";

export const taskStatusValues = [
  "not_started",
  "in_progress",
  "done",
  "cancelled",
] as const;

export const priorityValues = ["low", "medium", "high", "urgent"] as const;

export const createTaskSchema = z.object({
  projectId: z.string().uuid().nullish(),
  parentTaskId: z.string().uuid().nullish(),
  title: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).nullish(),
  dueDate: z.coerce.date().nullish(),
  status: z.enum(taskStatusValues).default("not_started"),
  priority: z.enum(priorityValues).default("medium"),
  notes: z.string().trim().min(1).nullish(),
  recurrenceRuleId: z.string().uuid().nullish(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
