"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useCollection, useResourceMutation } from "@/lib/hooks/use-collection";
import { proseMirrorToPlainText } from "@/lib/utils/prosemirror";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  title: string | null;
  content: unknown;
  parentType: string;
  updatedAt: string;
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Standalone", value: "standalone" },
  { label: "Attached", value: "attached" },
] as const;

export function NotesView() {
  const router = useRouter();
  const { data: notes = [], isLoading } = useCollection<Note>("notes");
  const create = useResourceMutation("notes");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>(
    "all",
  );

  const visible = useMemo(() => {
    if (filter === "standalone")
      return notes.filter((n) => n.parentType === "standalone");
    if (filter === "attached")
      return notes.filter((n) => n.parentType !== "standalone");
    return notes;
  }, [notes, filter]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-md px-2 py-1 text-xs text-text-muted hover:bg-bg-hover",
                filter === f.value && "bg-bg-hover text-text",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() =>
            create.mutate(
              { op: "create", body: { parentType: "standalone" } },
              {
                onSuccess: () =>
                  router.refresh(),
              },
            )
          }
          className="rounded-md border border-border-subtle px-2 py-1 text-xs text-text-muted hover:bg-bg-hover"
        >
          New note
        </button>
      </div>

      {isLoading ? (
        <p className="p-4 text-sm text-text-muted">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="p-4 text-sm text-text-muted">No notes.</p>
      ) : (
        <div className="flex flex-col">
          {visible.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => router.push(`/notes?detail=note:${n.id}`)}
              className="flex flex-col gap-0.5 border-b border-border-subtle px-4 py-2.5 text-left hover:bg-bg-hover"
            >
              <span className="text-sm text-text">
                {n.title ?? "Untitled"}
              </span>
              <span className="truncate text-xs text-text-subtle">
                {proseMirrorToPlainText(n.content) || "Empty note"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
