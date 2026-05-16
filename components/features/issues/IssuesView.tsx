"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DueDate } from "@/components/shared/DueDate";
import { LabelChip } from "@/components/shared/LabelChip";
import { ListView, type ListGroup } from "@/components/shared/ListView";
import { PriorityChip, type Priority } from "@/components/shared/PriorityChip";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useItemMutation,
  useItems,
  type ItemsFilters,
} from "@/lib/hooks/use-items";
import { useKeymapActions } from "@/lib/keymap/use-keymap";
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

const DUE_ORDER = ["overdue", "today", "week", "later", "none"] as const;
const DUE_LABEL: Record<string, string> = {
  overdue: "Overdue",
  today: "Today",
  week: "This week",
  later: "Later",
  none: "No due date",
};

function dueBucket(due: string | null, nowMs: number): string {
  if (!due) return "none";
  const d = new Date(due).getTime();
  const dayStart = new Date(nowMs).setHours(0, 0, 0, 0);
  const tomorrow = dayStart + 86_400_000;
  const weekEnd = dayStart + 7 * 86_400_000;
  if (d < dayStart) return "overdue";
  if (d < tomorrow) return "today";
  if (d < weekEnd) return "week";
  return "later";
}

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
  const searchParams = useSearchParams();
  const { openCreate } = useKeymapActions();
  const detailOpen = searchParams.has("detail");
  const [kindTab, setKindTab] = useState<ItemKind | "all">("all");
  const [groupMode, setGroupMode] = useState<"status" | "due">("status");
  const [nowMs] = useState(() => Date.now());
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
  const queryClient = useQueryClient();

  const groups: ListGroup<IssueItem>[] = useMemo(() => {
    if (groupMode === "due") {
      const byDue = new Map<string, IssueItem[]>();
      for (const it of items) {
        const b = dueBucket(it.dueDate, nowMs);
        const list = byDue.get(b) ?? [];
        list.push(it);
        byDue.set(b, list);
      }
      return DUE_ORDER.filter((k) => byDue.has(k)).map((k) => ({
        key: k,
        label: DUE_LABEL[k],
        items: byDue.get(k) ?? [],
      }));
    }
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
  }, [items, groupMode, nowMs]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef<{ at: number } | null>(null);

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bulkApply = useCallback(
    async (
      patch: Partial<Pick<IssueItem, "status" | "priority">> | "delete",
    ) => {
      const targets = flat.filter((i) => selected.has(i.id));
      if (targets.length === 0) return;
      await Promise.all(
        targets.map((it) => {
          const path = it.kind === "task" ? "tasks" : "assignments";
          if (patch === "delete") {
            return fetch(`/api/${path}/${it.id}`, { method: "DELETE" });
          }
          return fetch(`/api/${path}/${it.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(patch),
          });
        }),
      );
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    [flat, selected, queryClient],
  );

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
        case "J": {
          e.preventDefault();
          const next = Math.min(clampedIndex + 1, flat.length - 1);
          if (current) toggleSelected(current.id);
          if (flat[next]) toggleSelected(flat[next].id);
          setActiveIndex(next);
          return;
        }
        case "K": {
          e.preventDefault();
          const prev = Math.max(clampedIndex - 1, 0);
          if (current) toggleSelected(current.id);
          if (flat[prev]) toggleSelected(flat[prev].id);
          setActiveIndex(prev);
          return;
        }
        case "x":
          if (current) {
            e.preventDefault();
            toggleSelected(current.id);
          }
          return;
        case "o":
        case "e":
          if (current) {
            e.preventDefault();
            openDetail(current);
          }
          return;
        case "r":
          e.preventDefault();
          queryClient.invalidateQueries({ queryKey: ["items"] });
          return;
        case "Backspace":
          if (selected.size > 0) {
            e.preventDefault();
            if (window.confirm(`Delete ${selected.size} item(s)?`)) {
              void bulkApply("delete");
            }
          }
          return;
        case "Escape":
          if (selected.size > 0) setSelected(new Set());
          return;
        case "s":
          e.preventDefault();
          seqRef.current = { at: Date.now() };
          return;
        case "/":
          e.preventDefault();
          filterRef.current?.focus();
          return;
        case "]": {
          e.preventDefault();
          const next = Math.min(clampedIndex + 1, flat.length - 1);
          setActiveIndex(next);
          if (detailOpen && flat[next]) openDetail(flat[next]);
          return;
        }
        case "[": {
          e.preventDefault();
          const prev = Math.max(clampedIndex - 1, 0);
          setActiveIndex(prev);
          if (detailOpen && flat[prev]) openDetail(flat[prev]);
          return;
        }
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
  }, [
    flat,
    clampedIndex,
    mutation,
    openDetail,
    detailOpen,
    toggleSelected,
    bulkApply,
    selected,
    queryClient,
  ]);

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
        <div className="ml-1 flex items-center gap-1 border-l border-border-subtle pl-2">
          <span className="text-xs text-text-subtle">Group</span>
          {(["status", "due"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setGroupMode(m)}
              className={cn(
                "rounded-md px-2 py-1 text-xs text-text-muted capitalize hover:bg-bg-hover",
                groupMode === m && "bg-bg-hover text-text",
              )}
            >
              {m}
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
        <Button size="xs" onClick={() => openCreate("task")}>
          <Plus className="size-3" />
          New
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className="flex items-center gap-2 border-b border-border-subtle bg-bg-elevated px-4 py-1.5 text-xs">
          <span className="text-text-muted">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => bulkApply({ status: "done" })}
            className="rounded px-2 py-0.5 text-text-muted hover:bg-bg-hover hover:text-text"
          >
            Mark done
          </button>
          <button
            type="button"
            onClick={() => bulkApply({ status: "in_progress" })}
            className="rounded px-2 py-0.5 text-text-muted hover:bg-bg-hover hover:text-text"
          >
            In progress
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Delete ${selected.size} item(s)?`))
                void bulkApply("delete");
            }}
            className="rounded px-2 py-0.5 text-text-muted hover:bg-bg-hover"
            style={{ color: "var(--color-status-blocked)" }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded px-2 py-0.5 text-text-subtle hover:bg-bg-hover"
          >
            Clear
          </button>
        </div>
      ) : null}

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
          isSelected={(i) => selected.has(i.id)}
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
