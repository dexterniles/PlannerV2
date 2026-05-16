"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { itemsKey, type ItemsFilters } from "@/lib/query/keys";
import type { IssueItem, ItemKind } from "@/lib/validations/items";

export type { ItemsFilters };
export { itemsKey };

function toSearchParams(filters: ItemsFilters): string {
  const p = new URLSearchParams();
  if (filters.kinds?.length) p.set("kinds", filters.kinds.join(","));
  if (filters.projectId) p.set("projectId", filters.projectId);
  if (filters.courseId) p.set("courseId", filters.courseId);
  if (filters.status) p.set("status", filters.status);
  if (filters.priority) p.set("priority", filters.priority);
  if (filters.q) p.set("q", filters.q);
  return p.toString();
}

async function fetchItems(filters: ItemsFilters): Promise<IssueItem[]> {
  const qs = toSearchParams(filters);
  const res = await fetch(`/api/items${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load items");
  const json = (await res.json()) as { data: IssueItem[] };
  return json.data;
}

export function useItems(filters: ItemsFilters) {
  return useQuery({
    queryKey: itemsKey(filters),
    queryFn: () => fetchItems(filters),
  });
}

type PatchVars = {
  id: string;
  kind: ItemKind;
  patch: Partial<Pick<IssueItem, "status" | "priority" | "title">>;
};

async function patchItem({ id, kind, patch }: PatchVars): Promise<void> {
  const path = kind === "task" ? "tasks" : "assignments";
  const res = await fetch(`/api/${path}/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Update failed");
}

export function useItemMutation(filters: ItemsFilters) {
  const qc = useQueryClient();
  const key = itemsKey(filters);

  return useMutation({
    mutationFn: patchItem,
    onMutate: async (vars: PatchVars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<IssueItem[]>(key);
      qc.setQueryData<IssueItem[]>(key, (old) =>
        (old ?? []).map((it) =>
          it.id === vars.id && it.kind === vars.kind
            ? { ...it, ...vars.patch }
            : it,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Could not save change");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
