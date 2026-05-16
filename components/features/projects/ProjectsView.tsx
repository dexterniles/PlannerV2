"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DueDate } from "@/components/shared/DueDate";
import { ListView, type ListGroup } from "@/components/shared/ListView";
import { PriorityChip, type Priority } from "@/components/shared/PriorityChip";
import { StatusPill } from "@/components/shared/StatusPill";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { useCollection } from "@/lib/hooks/use-collection";

export type Project = {
  id: string;
  name: string;
  status: string;
  priority: Priority;
  targetDate: string | null;
};

const STATUS_ORDER = ["active", "planning", "paused", "done"];
const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  planning: "Planning",
  paused: "Paused",
  done: "Done",
};

export function ProjectsView() {
  const router = useRouter();
  const { data: projects = [], isLoading } = useCollection<Project>(
    "projects",
  );

  const groups: ListGroup<Project>[] = useMemo(() => {
    const byStatus = new Map<string, Project[]>();
    for (const p of projects) {
      const list = byStatus.get(p.status) ?? [];
      list.push(p);
      byStatus.set(p.status, list);
    }
    return STATUS_ORDER.filter((s) => byStatus.has(s)).map((s) => ({
      key: s,
      label: STATUS_LABEL[s] ?? s,
      items: byStatus.get(s) ?? [],
    }));
  }, [projects]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [activeIndex] = useState(0);
  const activeId = flat[activeIndex]?.id ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <ViewHeader title="Projects" createKind="project" />
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Loading…
        </div>
      ) : flat.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          No projects yet.
        </div>
      ) : (
        <ListView
          groups={groups}
          getId={(p) => p.id}
          activeId={activeId}
          onRowClick={(p) => router.push(`/projects?detail=project:${p.id}`)}
          renderRow={(p) => (
            <>
              <PriorityChip priority={p.priority} />
              <span className="w-24 shrink-0">
                <StatusPill status={p.status} />
              </span>
              <span className="flex-1 truncate text-sm text-text">
                {p.name}
              </span>
              <span className="w-16 shrink-0 text-right">
                <DueDate value={p.targetDate} />
              </span>
            </>
          )}
        />
      )}
    </div>
  );
}
