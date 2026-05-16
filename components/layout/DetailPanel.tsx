"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { IssueDetail } from "@/components/features/issues/IssueDetail";
import { CourseDetail } from "@/components/features/courses/CourseDetail";
import { EventDetail } from "@/components/features/events/EventDetail";
import { NoteDetail } from "@/components/features/notes/NoteDetail";
import { ProjectDetail } from "@/components/features/projects/ProjectDetail";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
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

function DetailBody({ kind, id }: { kind: string; id: string }) {
  if (kind === "task" || kind === "assignment") {
    return <IssueDetail kind={kind as ItemKind} id={id} />;
  }
  if (kind === "project") return <ProjectDetail id={id} />;
  if (kind === "course") return <CourseDetail id={id} />;
  if (kind === "event") return <EventDetail id={id} />;
  if (kind === "note") return <NoteDetail id={id} />;
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-text-muted">
      Detail content is implemented per feature.
    </div>
  );
}

function DetailHeader({
  kind,
  id,
  onClose,
}: {
  kind: string;
  id: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-3">
      <span className="text-xs text-text-subtle">
        {kind} · {id}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close panel"
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

export function DetailPanel({ mobile = false }: { mobile?: boolean }) {
  const searchParams = useSearchParams();
  const { closeDetail } = useKeymapActions();
  const reduceMotion = useReducedMotion();
  const detail = parseDetailParam(searchParams.get("detail"));

  if (mobile) {
    return (
      <Drawer
        direction="right"
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DrawerContent className="flex flex-col">
          <DrawerTitle className="sr-only">
            {detail ? `${detail.kind} detail` : "Detail"}
          </DrawerTitle>
          {detail ? (
            <>
              <DetailHeader
                kind={detail.kind}
                id={detail.id}
                onClose={closeDetail}
              />
              <DetailBody kind={detail.kind} id={detail.id} />
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AnimatePresence>
      {detail ? (
        <motion.aside
          key="detail-panel"
          initial={reduceMotion ? false : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex h-full w-full max-w-[480px] shrink-0 flex-col border-l border-border-subtle bg-bg lg:w-[480px]"
        >
          <DetailHeader
            kind={detail.kind}
            id={detail.id}
            onClose={closeDetail}
          />
          <DetailBody kind={detail.kind} id={detail.id} />
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
