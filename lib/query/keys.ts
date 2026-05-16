import type { ItemKind } from "@/lib/validations/items";

export type ItemsFilters = {
  kinds?: ItemKind[];
  projectId?: string;
  courseId?: string;
  status?: string;
  priority?: string;
  q?: string;
};

export const itemsKey = (filters: ItemsFilters) =>
  ["items", filters] as const;
