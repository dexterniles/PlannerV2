"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export type ActiveTimer = {
  id: string;
  loggableType: "course" | "project" | "assignment" | "task";
  loggableId: string;
  startedAt: string;
} | null;

export const activeTimerKey = ["time-log-active"] as const;

export function useActiveTimer() {
  return useQuery<ActiveTimer>({
    queryKey: activeTimerKey,
    queryFn: async () => {
      const res = await fetch("/api/time-logs/active");
      if (!res.ok) throw new Error("Failed to load timer");
      const json = (await res.json()) as { data: ActiveTimer };
      return json.data;
    },
    refetchInterval: 30_000,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      loggableType: "course" | "project" | "assignment" | "task";
      loggableId: string;
    }) => {
      const res = await fetch("/api/time-logs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) throw new Error("Could not start timer");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activeTimerKey });
      toast.success("Timer started");
    },
    onError: () => toast.error("Could not start timer"),
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/time-logs/${id}/stop`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Could not stop timer");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activeTimerKey });
      toast.success("Timer stopped");
    },
    onError: () => toast.error("Could not stop timer"),
  });
}
