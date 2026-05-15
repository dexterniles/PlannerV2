"use client";

import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTOSAVE_MS = 3000;

export function Editor({
  noteId,
  initialContent,
}: {
  noteId: string;
  initialContent: JSONContent;
}) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const dirtyRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Write something…" }),
      Link.configure({ autolink: true, openOnClick: true }),
      Mention.configure({ suggestion: { items: () => [] } }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] text-text",
      },
    },
    onUpdate: () => {
      dirtyRef.current = true;
    },
  });

  const save = useCallback(async () => {
    if (!dirtyRef.current || !editor) return;
    dirtyRef.current = false;
    setSaving(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: editor.getJSON() }),
    });
    setSaving(false);
    setSavedAt(res.ok ? Date.now() : null);
  }, [noteId, editor]);

  useEffect(() => {
    if (!editor) return;
    const onBlur = () => void save();
    editor.on("blur", onBlur);
    const autosave = setInterval(() => void save(), AUTOSAVE_MS);
    const tick = setInterval(() => setNowTs(Date.now()), 1000);
    return () => {
      editor.off("blur", onBlur);
      clearInterval(autosave);
      clearInterval(tick);
    };
  }, [editor, save]);

  const indicator = saving
    ? "Saving…"
    : savedAt
      ? `Saved · ${Math.max(0, Math.round((nowTs - savedAt) / 1000))}s ago`
      : "Not saved yet";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-4 pt-2 text-xs text-text-subtle">
        {indicator}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
