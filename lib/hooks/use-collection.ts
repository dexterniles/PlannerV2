"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  const json = (await res.json()) as { data: T };
  return json.data;
}

export function useCollection<T>(path: string, search?: string) {
  const url = search ? `/api/${path}?${search}` : `/api/${path}`;
  return useQuery({
    queryKey: ["collection", path, search ?? ""],
    queryFn: () => getJson<T[]>(url),
  });
}

export function useResource<T>(path: string, id: string | null) {
  return useQuery({
    queryKey: ["resource", path, id],
    enabled: !!id,
    queryFn: () => getJson<T>(`/api/${path}/${id}`),
  });
}

type WriteVars =
  | { op: "create"; body: unknown }
  | { op: "patch"; id: string; body: unknown }
  | { op: "delete"; id: string };

export function useResourceMutation(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: WriteVars) => {
      const url =
        vars.op === "create" ? `/api/${path}` : `/api/${path}/${vars.id}`;
      const method =
        vars.op === "create" ? "POST" : vars.op === "patch" ? "PATCH" : "DELETE";
      const res = await fetch(url, {
        method,
        headers:
          vars.op === "delete"
            ? undefined
            : { "content-type": "application/json" },
        body: vars.op === "delete" ? undefined : JSON.stringify(vars.body),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onError: () => toast.error("Could not save change"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["collection", path] });
      qc.invalidateQueries({ queryKey: ["resource", path] });
    },
  });
}
