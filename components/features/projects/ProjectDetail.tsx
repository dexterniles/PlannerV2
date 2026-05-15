"use client";

import { useState } from "react";

import { DueDate } from "@/components/shared/DueDate";
import { statusLabel } from "@/components/shared/StatusPill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCollection,
  useResource,
  useResourceMutation,
} from "@/lib/hooks/use-collection";
import {
  priorityValues,
  projectStatusValues,
} from "@/lib/validations/projects";

type Project = {
  id: string;
  name: string;
  status: string;
  priority: string;
  targetDate: string | null;
};

type Milestone = {
  id: string;
  title: string;
  targetDate: string | null;
  completedAt: string | null;
};

export function ProjectDetail({ id }: { id: string }) {
  const { data, isLoading } = useResource<Project>("projects", id);
  const mutate = useResourceMutation("projects");
  const milestoneMutate = useResourceMutation("milestones");
  const { data: milestones = [] } = useCollection<Milestone>(
    "milestones",
    `projectId=${id}`,
  );

  const [draft, setDraft] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState("");
  const name = draft ?? data?.name ?? "";

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <input
        value={name}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== data.name) {
            mutate.mutate({ op: "patch", id, body: { name: name.trim() } });
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="bg-transparent text-lg font-medium text-text outline-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-subtle">Status</span>
        <Select
          value={data.status}
          onValueChange={(v) =>
            mutate.mutate({ op: "patch", id, body: { status: v } })
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-subtle">Priority</span>
        <Select
          value={data.priority}
          onValueChange={(v) =>
            mutate.mutate({ op: "patch", id, body: { priority: v } })
          }
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

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-subtle">Target</span>
        {data.targetDate ? (
          <DueDate value={data.targetDate} />
        ) : (
          <span className="text-xs text-text-subtle">—</span>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          Milestones
        </span>
        {milestones.map((m) => (
          <label
            key={m.id}
            className="flex items-center gap-2 text-sm text-text"
          >
            <input
              type="checkbox"
              checked={!!m.completedAt}
              onChange={(e) =>
                milestoneMutate.mutate({
                  op: "patch",
                  id: m.id,
                  body: {
                    completedAt: e.target.checked
                      ? new Date().toISOString()
                      : null,
                  },
                })
              }
            />
            <span className={m.completedAt ? "line-through text-text-muted" : ""}>
              {m.title}
            </span>
          </label>
        ))}
        <input
          value={newMilestone}
          onChange={(e) => setNewMilestone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newMilestone.trim()) {
              milestoneMutate.mutate({
                op: "create",
                body: { projectId: id, title: newMilestone.trim() },
              });
              setNewMilestone("");
            }
          }}
          placeholder="Add milestone…"
          className="bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
        />
      </div>
    </div>
  );
}
