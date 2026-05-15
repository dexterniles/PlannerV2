"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

import { IssueDetail } from "@/components/features/issues/IssueDetail";
import { CourseDetail } from "@/components/features/courses/CourseDetail";
import { EventDetail } from "@/components/features/events/EventDetail";
import { NoteDetail } from "@/components/features/notes/NoteDetail";
import { ProjectDetail } from "@/components/features/projects/ProjectDetail";
import { Button } from "@/components/ui/button";
import { useKeymapActions } from "@/lib/keymap/use-keymap";
import type { ItemKind } from "@/lib/validations/items";

export function parseDetailParam(
  value: string | null,
): { kind: string; id: string } | null {
  if (!value) return null;
  const [kind, id] = value.split(":");
  if (!kind || !id) return null;
  return { kind, id };
}

export function DetailPanel() {
  const searchParams = useSearchParams();
  const { closeDetail } = useKeymapActions();
  const detail = parseDetailParam(searchParams.get("detail"));

  return (
    <AnimatePresence>
      {detail ? (
        <motion.aside
          key="detail-panel"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-full w-[480px] shrink-0 flex-col border-l border-border-subtle bg-bg"
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-3">
            <span className="text-xs text-text-subtle">
              {detail.kind} · {detail.id}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close panel"
              onClick={closeDetail}
            >
              <X className="size-4" />
            </Button>
          </div>
          {detail.kind === "task" || detail.kind === "assignment" ? (
            <IssueDetail kind={detail.kind as ItemKind} id={detail.id} />
          ) : detail.kind === "project" ? (
            <ProjectDetail id={detail.id} />
          ) : detail.kind === "course" ? (
            <CourseDetail id={detail.id} />
          ) : detail.kind === "event" ? (
            <EventDetail id={detail.id} />
          ) : detail.kind === "note" ? (
            <NoteDetail id={detail.id} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-text-muted">
              Detail content is implemented per feature.
            </div>
          )}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
