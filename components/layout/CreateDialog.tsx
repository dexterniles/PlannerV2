"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection } from "@/lib/hooks/use-collection";
import {
  CREATE_LABEL,
  CREATE_PATH,
  type CreateKind,
} from "@/lib/create/kinds";

type FieldType = "text" | "number" | "date" | "datetime" | "select";

type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionsFrom?: "workspaces" | "projects" | "courses";
  options?: { value: string; label: string }[];
};

const PRIORITY_OPTS = ["low", "medium", "high", "urgent"].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));

const FIELDS: Record<CreateKind, Field[]> = {
  task: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "projectId", label: "Project", type: "select", optionsFrom: "projects" },
    { name: "priority", label: "Priority", type: "select", options: PRIORITY_OPTS },
    { name: "dueDate", label: "Due", type: "datetime" },
  ],
  assignment: [
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: true,
      optionsFrom: "courses",
    },
    { name: "dueDate", label: "Due", type: "datetime" },
  ],
  project: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "workspaceId",
      label: "Workspace",
      type: "select",
      required: true,
      optionsFrom: "workspaces",
    },
    { name: "priority", label: "Priority", type: "select", options: PRIORITY_OPTS },
  ],
  course: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "workspaceId",
      label: "Workspace",
      type: "select",
      required: true,
      optionsFrom: "workspaces",
    },
    { name: "code", label: "Code", type: "text" },
  ],
  event: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "startsAt", label: "Starts", type: "datetime", required: true },
    { name: "endsAt", label: "Ends", type: "datetime" },
  ],
  bill: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "dueDate", label: "Due date", type: "date", required: true },
  ],
  income: [
    { name: "source", label: "Source", type: "text" },
    { name: "amount", label: "Amount", type: "number", required: true },
    {
      name: "receivedDate",
      label: "Received",
      type: "date",
      required: true,
    },
  ],
  note: [{ name: "title", label: "Title", type: "text" }],
  workspace: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "type",
      label: "Type",
      type: "select",
      options: ["custom", "academic", "projects"].map((v) => ({
        value: v,
        label: v,
      })),
    },
  ],
};

const DETAIL_ROUTE: Partial<Record<CreateKind, string>> = {
  task: "/issues",
  assignment: "/issues",
  project: "/projects",
  course: "/courses",
  event: "/events",
  note: "/notes",
};

function OptionsSelect({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const path =
    field.optionsFrom === "workspaces"
      ? "workspaces"
      : field.optionsFrom === "projects"
        ? "projects"
        : "courses";
  const { data = [] } = useCollection<{ id: string; name: string }>(
    path,
    undefined,
  );
  const opts =
    field.options ??
    data.map((d) => ({ value: d.id, label: d.name }));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateForm({
  kind,
  onClose,
}: {
  kind: CreateKind;
  onClose: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fields = FIELDS[kind];

  function buildBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (raw == null || raw === "") continue;
      body[f.name] = f.type === "number" ? Number(raw) : raw;
    }
    if (kind === "note") body.parentType = "standalone";
    return body;
  }

  async function submit() {
    for (const f of fields) {
      if (f.required && !values[f.name]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setBusy(true);
    const res = await fetch(`/api/${CREATE_PATH[kind]}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildBody()),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(`Could not create ${CREATE_LABEL[kind].toLowerCase()}`);
      return;
    }
    const json = (await res.json()) as { data: { id: string } };
    qc.invalidateQueries({ queryKey: ["items"] });
    qc.invalidateQueries({ queryKey: ["collection"] });
    toast.success(`${CREATE_LABEL[kind]} created`);
    onClose();
    const route = DETAIL_ROUTE[kind];
    if (route && json.data?.id) {
      router.push(`${route}?detail=${kind}:${json.data.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy) void submit();
      }}
      className="flex flex-col gap-3"
    >
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-text-subtle">
            {f.label}
            {f.required ? " *" : ""}
          </span>
          {f.type === "select" ? (
            <OptionsSelect
              field={f}
              value={values[f.name] ?? ""}
              onChange={(v) =>
                setValues((s) => ({ ...s, [f.name]: v }))
              }
            />
          ) : (
            <Input
              autoFocus={f === fields[0]}
              type={
                f.type === "datetime"
                  ? "datetime-local"
                  : f.type === "date"
                    ? "date"
                    : f.type === "number"
                      ? "number"
                      : "text"
              }
              value={values[f.name] ?? ""}
              onChange={(e) =>
                setValues((s) => ({ ...s, [f.name]: e.target.value }))
              }
              className="h-8"
            />
          )}
        </label>
      ))}
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export function CreateDialog({
  kind,
  onOpenChange,
}: {
  kind: CreateKind | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={kind !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            New {kind ? CREATE_LABEL[kind].toLowerCase() : ""}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill in the fields and submit to create a new{" "}
            {kind ? CREATE_LABEL[kind].toLowerCase() : "item"}.
          </DialogDescription>
        </DialogHeader>
        {kind ? (
          <CreateForm kind={kind} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
