import { z } from "zod";

export const workspaceTypeValues = [
  "academic",
  "projects",
  "custom",
] as const;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(workspaceTypeValues).default("custom"),
  color: z.string().trim().min(1).nullish(),
  icon: z.string().trim().min(1).nullish(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
