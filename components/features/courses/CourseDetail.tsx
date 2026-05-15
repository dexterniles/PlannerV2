"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
import { courseStatusValues } from "@/lib/validations/courses";

type Course = {
  id: string;
  name: string;
  status: string;
  instructor: string | null;
  semester: string | null;
  syllabusName: string | null;
};

type GradeCategory = {
  id: string;
  name: string;
  weight: string;
};

export function CourseDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useResource<Course>("courses", id);
  const mutate = useResourceMutation("courses");
  const catMutate = useResourceMutation("grade-categories");
  const { data: categories = [] } = useCollection<GradeCategory>(
    "grade-categories",
    `courseId=${id}`,
  );

  const [draft, setDraft] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catWeight, setCatWeight] = useState("");
  const [uploading, setUploading] = useState(false);
  const name = draft ?? data?.name ?? "";

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  async function onUpload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/courses/${id}/syllabus`, {
      method: "POST",
      body,
    });
    setUploading(false);
    if (!res.ok) {
      toast.error("Syllabus upload failed");
      return;
    }
    toast.success("Syllabus uploaded");
    qc.invalidateQueries({ queryKey: ["resource", "courses", id] });
  }

  async function onViewSyllabus() {
    const res = await fetch(`/api/courses/${id}/syllabus`);
    if (!res.ok) {
      toast.error("No syllabus available");
      return;
    }
    const json = (await res.json()) as { data: { url: string } };
    window.open(json.data.url, "_blank", "noopener");
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
            {courseStatusValues.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.instructor ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-text-subtle">Instructor</span>
          <span className="text-text">{data.instructor}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          Grade categories
        </span>
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between text-sm text-text"
          >
            <span>{c.name}</span>
            <span className="text-text-muted tabular-nums">{c.weight}%</span>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Category"
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          />
          <input
            value={catWeight}
            onChange={(e) => setCatWeight(e.target.value)}
            placeholder="%"
            inputMode="decimal"
            className="w-12 bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                catName.trim() &&
                catWeight.trim()
              ) {
                catMutate.mutate({
                  op: "create",
                  body: {
                    courseId: id,
                    name: catName.trim(),
                    weight: Number(catWeight),
                  },
                });
                setCatName("");
                setCatWeight("");
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          Syllabus
        </span>
        {data.syllabusName ? (
          <button
            type="button"
            onClick={onViewSyllabus}
            className="text-left text-sm text-brand hover:underline"
          >
            {data.syllabusName}
          </button>
        ) : (
          <span className="text-sm text-text-subtle">None uploaded</span>
        )}
        <label className="text-sm text-text-muted">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.md"
            disabled={uploading}
            className="text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}
