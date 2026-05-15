"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DueDate } from "@/components/shared/DueDate";
import { LabelChip } from "@/components/shared/LabelChip";
import { ListView, type ListGroup } from "@/components/shared/ListView";
import { PriorityChip, type Priority } from "@/components/shared/PriorityChip";
import { StatusPill } from "@/components/shared/StatusPill";
import { Input } from "@/components/ui/input";
import {
  useItemMutation,
  useItems,
  type ItemsFilters,
} from "@/lib/hooks/use-items";
import type { IssueItem, ItemKind } from "@/lib/validations/items";
import { cn } from "@/lib/utils";

const STATUS_ORDER = [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
  "done",
  "cancelled",
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Todo",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
  cancelled: "Cancelled",
};

const PRIORITY_BY_DIGIT: Record<string, Priority> = {
  "1": "urgent",
  "2": "high",
  "3": "medium",
  "4": "low",
};

function statusForKey(kind: ItemKind, key: string): string | null {
  const taskMap: Record<string, string> = {
    t: "not_started",
    p: "in_progress",
    d: "done",
    c: "cancelled",
  };
  const assignmentMap: Record<string, string> = {
    t: "not_started",
    p: "in_progress",
    d: "graded",
    c: "not_started",
  };
  return (kind === "task" ? taskMap : assignmentMap)[key] ?? null;
}

const KIND_TABS: { label: string; value: ItemKind | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tasks", value: "task" },
  { label: "Assignments", value: "assignment" },
];

export function IssuesView() {
  const router = useRouter();
  const [kindTab, setKindTab] = useState<ItemKind | "all">("all");
  const [q, setQ] = useState("");

  const filters: ItemsFilters = useMemo(
    () => ({
      kinds: kindTab === "all" ? undefined : [kindTab],
      q: q.trim() || undefined,
    }),
    [kindTab, q],
  );

  const { data: items = [], isLoading } = useItems(filters);
  const mutation = useItemMutation(filters);

  const groups: ListGroup<IssueItem>[] = useMemo(() => {
    const byStatus = new Map<string, IssueItem[]>();
    for (const it of items) {
      const list = byStatus.get(it.status) ?? [];
      list.push(it);
      byStatus.set(it.status, list);
    }
    return STATUS_ORDER.filter((s) => byStatus.has(s)).map((s) => ({
      key: s,
      label: STATUS_LABEL[s] ?? s,
      items: byStatus.get(s) ?? [],
    }));
  }, [items]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [activeIndex, setActiveIndex] = useState(0);
  const filterRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef<{ at: number } | null>(null);

  const clampedIndex = Math.min(activeIndex, Math.max(0, flat.length - 1));
  const activeId = flat[clampedIndex]?.id ?? null;

  const openDetail = useCallback(
    (item: IssueItem) => {
      router.push(`/issues?detail=${item.kind}:${item.id}`);
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const editable =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if (editable) {
        if (e.key === "Escape") (el as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const current = flat[clampedIndex];
      const seqActive =
        seqRef.current && Date.now() - seqRef.current.at < 800;
      seqRef.current = null;

      if (seqActive && current) {
        const target = statusForKey(current.kind, e.key.toLowerCase());
        if (target) {
          e.preventDefault();
          mutation.mutate({
            id: current.id,
            kind: current.kind,
            patch: { status: target },
          });
        }
        return;
      }

      switch (e.key) {
        case "j":
          e.preventDefault();
          setActiveIndex(Math.min(clampedIndex + 1, flat.length - 1));
          return;
        case "k":
          e.preventDefault();
          setActiveIndex(Math.max(clampedIndex - 1, 0));
          return;
        case "Enter":
          if (current) {
            e.preventDefault();
            openDetail(current);
          }
          return;
        case "s":
          e.preventDefault();
          seqRef.current = { at: Date.now() };
          return;
        case "/":
          e.preventDefault();
          filterRef.current?.focus();
          return;
      }

      if (current && current.kind === "task" && PRIORITY_BY_DIGIT[e.key]) {
        e.preventDefault();
        mutation.mutate({
          id: current.id,
          kind: current.kind,
          patch: { priority: PRIORITY_BY_DIGIT[e.key] },
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flat, clampedIndex, mutation, openDetail]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
        <div className="flex items-center gap-1">
          {KIND_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setKindTab(t.value)}
              className={cn(
                "rounded-md px-2 py-1 text-xs text-text-muted hover:bg-bg-hover",
                kindTab === t.value && "bg-bg-hover text-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Input
          ref={filterRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter…  ( / )"
          className="h-7 w-56 text-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Loading…
        </div>
      ) : flat.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          No issues.
        </div>
      ) : (
        <ListView
          groups={groups}
          getId={(i) => i.id}
          activeId={activeId}
          onRowClick={openDetail}
          renderRow={(item) => (
            <>
              <PriorityChip priority={item.priority as Priority | null} />
              <span className="w-28 shrink-0">
                <StatusPill status={item.status} />
              </span>
              <span className="flex-1 truncate text-sm text-text">
                {item.title}
              </span>
              {item.labels.map((l) => (
                <LabelChip key={l.id} name={l.name} color={l.color} />
              ))}
              {item.parentName ? (
                <span className="shrink-0 text-xs text-text-subtle">
                  {item.parentName}
                </span>
              ) : null}
              <span className="w-16 shrink-0 text-right">
                <DueDate value={item.dueDate} />
              </span>
            </>
          )}
        />
      )}
    </div>
  );
}
