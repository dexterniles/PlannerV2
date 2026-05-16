export const CREATE_KINDS = [
  "task",
  "assignment",
  "project",
  "course",
  "event",
  "bill",
  "income",
  "note",
  "workspace",
] as const;

export type CreateKind = (typeof CREATE_KINDS)[number];

export const CREATE_LABEL: Record<CreateKind, string> = {
  task: "Task",
  assignment: "Assignment",
  project: "Project",
  course: "Course",
  event: "Event",
  bill: "Bill",
  income: "Income",
  note: "Note",
  workspace: "Workspace",
};

// API collection path per kind.
export const CREATE_PATH: Record<CreateKind, string> = {
  task: "tasks",
  assignment: "assignments",
  project: "projects",
  course: "courses",
  event: "events",
  bill: "bills",
  income: "income",
  note: "notes",
  workspace: "workspaces",
};

// Which list the first path segment maps to, for context-aware `c`.
export function kindForPath(pathname: string): CreateKind {
  if (pathname.startsWith("/projects")) return "project";
  if (pathname.startsWith("/courses")) return "course";
  if (pathname.startsWith("/events")) return "event";
  if (pathname.startsWith("/money")) return "bill";
  if (pathname.startsWith("/notes")) return "note";
  return "task";
}
