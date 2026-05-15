"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { ListView, type ListGroup } from "@/components/shared/ListView";
import { StatusPill } from "@/components/shared/StatusPill";
import { useCollection } from "@/lib/hooks/use-collection";

type Course = {
  id: string;
  name: string;
  code: string | null;
  status: string;
  credits: string | null;
  semester: string | null;
};

const STATUS_ORDER = ["active", "planned", "completed", "dropped"];
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  planned: "Planned",
  completed: "Completed",
  dropped: "Dropped",
};

export function CoursesView() {
  const router = useRouter();
  const { data: courses = [], isLoading } = useCollection<Course>("courses");

  const groups: ListGroup<Course>[] = useMemo(() => {
    const byStatus = new Map<string, Course[]>();
    for (const c of courses) {
      const list = byStatus.get(c.status) ?? [];
      list.push(c);
      byStatus.set(c.status, list);
    }
    return STATUS_ORDER.filter((s) => byStatus.has(s)).map((s) => ({
      key: s,
      label: STATUS_LABEL[s] ?? s,
      items: byStatus.get(s) ?? [],
    }));
  }, [courses]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (courses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        No courses.
      </div>
    );
  }

  return (
    <ListView
      groups={groups}
      getId={(c) => c.id}
      activeId={null}
      onRowClick={(c) => router.push(`/courses?detail=course:${c.id}`)}
      renderRow={(c) => (
        <>
          <span className="w-24 shrink-0">
            <StatusPill status={c.status} />
          </span>
          <span className="flex-1 truncate text-sm text-text">
            {c.code ? (
              <span className="text-text-subtle">{c.code} · </span>
            ) : null}
            {c.name}
          </span>
          {c.semester ? (
            <span className="shrink-0 text-xs text-text-subtle">
              {c.semester}
            </span>
          ) : null}
          {c.credits ? (
            <span className="w-12 shrink-0 text-right text-xs text-text-muted tabular-nums">
              {c.credits} cr
            </span>
          ) : null}
        </>
      )}
    />
  );
}
