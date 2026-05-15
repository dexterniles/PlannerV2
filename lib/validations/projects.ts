import { z } from "zod";

export const projectStatusValues = [
  "planning",
  "active",
  "paused",
  "done",
] as const;

export const priorityValues = ["low", "medium", "high", "urgent"] as const;

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).nullish(),
  goal: z.string().trim().min(1).nullish(),
  status: z.enum(projectStatusValues).default("planning"),
  priority: z.enum(priorityValues).default("medium"),
  startDate: z.coerce.date().nullish(),
  targetDate: z.coerce.date().nullish(),
  color: z.string().trim().min(1).nullish(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .omit({ workspaceId: true });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
