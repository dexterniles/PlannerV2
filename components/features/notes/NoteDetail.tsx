"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { JSONContent } from "@tiptap/react";

import { EditorSkeleton } from "@/components/features/notes/EditorSkeleton";
import { useResource, useResourceMutation } from "@/lib/hooks/use-collection";

const Editor = dynamic(
  () => import("@/components/features/notes/Editor").then((m) => m.Editor),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

type Note = {
  id: string;
  title: string | null;
  content: JSONContent;
};

export function NoteDetail({ id }: { id: string }) {
  const { data, isLoading } = useResource<Note>("notes", id);
  const mutate = useResourceMutation("notes");
  const [draft, setDraft] = useState<string | null>(null);
  const title = draft ?? data?.title ?? "";

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <input
        value={title}
        placeholder="Untitled"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (title !== (data.title ?? "")) {
            mutate.mutate({
              op: "patch",
              id,
              body: { title: title.trim() || null },
            });
            setDraft(null);
          }
        }}
        className="bg-transparent px-4 pt-4 text-lg font-medium text-text outline-none placeholder:text-text-subtle"
      />
      <Editor noteId={id} initialContent={data.content ?? {}} />
    </div>
  );
}
