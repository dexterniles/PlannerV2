"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DueDate } from "@/components/shared/DueDate";
import { useStartTimer } from "@/lib/hooks/use-timer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignmentStatusValues,
} from "@/lib/validations/assignments";
import { priorityValues, taskStatusValues } from "@/lib/validations/tasks";
import type { ItemKind } from "@/lib/validations/items";
import { statusLabel } from "@/components/shared/StatusPill";

type IssueRecord = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate: string | null;
};

function path(kind: ItemKind) {
  return kind === "task" ? "tasks" : "assignments";
}

async function fetchRecord(
  kind: ItemKind,
  id: string,
): Promise<IssueRecord> {
  const res = await fetch(`/api/${path(kind)}/${id}`);
  if (!res.ok) throw new Error("Failed to load");
  const json = (await res.json()) as { data: IssueRecord };
  return json.data;
}

export function IssueDetail({ kind, id }: { kind: ItemKind; id: string }) {
  const qc = useQueryClient();
  const startTimer = useStartTimer();
  const key = ["issue", kind, id] as const;

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchRecord(kind, id),
  });

  const [draft, setDraft] = useState<string | null>(null);
  const title = draft ?? data?.title ?? "";

  const mutation = useMutation({
    mutationFn: async (patch: Partial<IssueRecord>) => {
      const res = await fetch(`/api/${path(kind)}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onError: () => toast.error("Could not save change"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  const statusOptions =
    kind === "task" ? taskStatusValues : assignmentStatusValues;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <input
        value={title}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (title.trim() && title !== data.title) {
            mutation.mutate({ title: title.trim() });
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="bg-transparent text-lg font-medium text-text outline-none"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-subtle">Status</span>
          <Select
            value={data.status}
            onValueChange={(v) => mutation.mutate({ status: v })}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {kind === "task" ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-subtle">Priority</span>
            <Select
              value={data.priority ?? "medium"}
              onValueChange={(v) => mutation.mutate({ priority: v })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityValues.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-xs text-text-subtle">Due</span>
          {data.dueDate ? (
            <DueDate value={data.dueDate} />
          ) : (
            <span className="text-xs text-text-subtle">—</span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            startTimer.mutate({ loggableType: kind, loggableId: id })
          }
          className="mt-1 flex h-7 items-center justify-center gap-1.5 rounded-md border border-border-subtle text-xs text-text-muted hover:bg-bg-hover"
        >
          <Timer className="size-3.5" />
          Start timer
        </button>
      </div>
    </div>
  );
}
