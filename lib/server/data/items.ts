import { and, eq, ilike, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { assignments, courses, projects, tags, taggings, tasks } from "@/lib/db/schema";
import type { IssueItem, ItemLabel, ItemsQuery } from "@/lib/validations/items";

function labelsByItem(
  rows: { itemId: string; id: string; name: string; color: string | null }[],
): Map<string, ItemLabel[]> {
  const map = new Map<string, ItemLabel[]>();
  for (const r of rows) {
    const list = map.get(r.itemId) ?? [];
    list.push({ id: r.id, name: r.name, color: r.color });
    map.set(r.itemId, list);
  }
  return map;
}

export async function getItems(
  userId: string,
  query: ItemsQuery,
): Promise<IssueItem[]> {
  const wantTask = !query.kinds || query.kinds.includes("task");
  const wantAssignment =
    (!query.kinds || query.kinds.includes("assignment")) && !query.priority;

  const items: IssueItem[] = [];

  if (wantTask && !query.courseId) {
    const conds = [eq(tasks.userId, userId)];
    if (query.projectId) conds.push(eq(tasks.projectId, query.projectId));
    if (query.status) conds.push(sql`${tasks.status} = ${query.status}`);
    if (query.priority) conds.push(sql`${tasks.priority} = ${query.priority}`);
    if (query.dueBefore) conds.push(lte(tasks.dueDate, query.dueBefore));
    if (query.q) conds.push(ilike(tasks.title, `%${query.q}%`));

    const rows = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        parentId: tasks.projectId,
        parentName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conds));

    for (const r of rows) {
      items.push({
        id: r.id,
        kind: "task",
        title: r.title,
        status: r.status,
        priority: r.priority,
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        parentId: r.parentId,
        parentType: r.parentId ? "project" : null,
        parentName: r.parentName,
        labels: [],
      });
    }
  }

  if (wantAssignment && !query.projectId) {
    const conds = [eq(assignments.userId, userId)];
    if (query.courseId) conds.push(eq(assignments.courseId, query.courseId));
    if (query.status) conds.push(sql`${assignments.status} = ${query.status}`);
    if (query.dueBefore) conds.push(lte(assignments.dueDate, query.dueBefore));
    if (query.q) conds.push(ilike(assignments.title, `%${query.q}%`));

    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        status: assignments.status,
        dueDate: assignments.dueDate,
        parentId: assignments.courseId,
        parentName: courses.name,
      })
      .from(assignments)
      .leftJoin(courses, eq(assignments.courseId, courses.id))
      .where(and(...conds));

    for (const r of rows) {
      items.push({
        id: r.id,
        kind: "assignment",
        title: r.title,
        status: r.status,
        priority: null,
        dueDate: r.dueDate ? r.dueDate.toISOString() : null,
        parentId: r.parentId,
        parentType: "course",
        parentName: r.parentName,
        labels: [],
      });
    }
  }

  if (items.length > 0) {
    const ids = items.map((i) => i.id);
    const labelRows = await db
      .select({
        itemId: taggings.taggableId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(taggings)
      .innerJoin(tags, eq(taggings.tagId, tags.id))
      .where(
        and(
          eq(tags.userId, userId),
          inArray(taggings.taggableType, ["task", "assignment"]),
          inArray(taggings.taggableId, ids),
        ),
      );
    const byItem = labelsByItem(labelRows);
    for (const item of items) {
      item.labels = byItem.get(item.id) ?? [];
    }
  }

  const filtered = query.label
    ? items.filter((i) => i.labels.some((l) => l.name === query.label))
    : items;

  return filtered.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title);
  });
}
