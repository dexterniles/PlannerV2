import { z } from "zod";

export const noteParentTypeValues = [
  "course",
  "project",
  "assignment",
  "task",
  "session",
  "daily_log",
  "standalone",
  "event",
] as const;

export const createNoteSchema = z.object({
  parentType: z.enum(noteParentTypeValues).default("standalone"),
  parentId: z.string().uuid().nullish(),
  title: z.string().trim().min(1).max(300).nullish(),
  content: z.record(z.string(), z.unknown()).default({}),
  sessionDate: z.coerce.date().nullish(),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(300).nullish(),
  content: z.record(z.string(), z.unknown()).optional(),
  sessionDate: z.coerce.date().nullish(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
