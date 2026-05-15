import { z } from "zod";

export const itemKinds = ["task", "assignment"] as const;
export type ItemKind = (typeof itemKinds)[number];

const csvKinds = z
  .string()
  .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  .pipe(z.array(z.enum(itemKinds)).min(1))
  .optional();

export const itemsQuerySchema = z.object({
  kinds: csvKinds,
  projectId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  status: z.string().min(1).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueBefore: z.coerce.date().optional(),
  label: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
});

export type ItemsQuery = z.infer<typeof itemsQuerySchema>;

export type ItemLabel = { id: string; name: string; color: string | null };

export type IssueItem = {
  id: string;
  kind: ItemKind;
  title: string;
  status: string;
  priority: "low" | "medium" | "high" | "urgent" | null;
  dueDate: string | null;
  parentId: string | null;
  parentType: "project" | "course" | null;
  parentName: string | null;
  labels: ItemLabel[];
};
