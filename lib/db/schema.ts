import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const workspaceType = pgEnum("workspace_type", ["academic", "projects", "custom"]);
export const courseStatus = pgEnum("course_status", ["planned", "active", "completed", "dropped"]);
export const assignmentStatus = pgEnum("assignment_status", [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
]);
export const projectStatus = pgEnum("project_status", ["planning", "active", "paused", "done"]);
export const priority = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const taskStatus = pgEnum("task_status", ["not_started", "in_progress", "done", "cancelled"]);
export const noteParentType = pgEnum("note_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
  "session",
  "daily_log",
  "standalone",
  "event",
]);
export const resourceParentType = pgEnum("resource_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
]);
export const resourceType = pgEnum("resource_type", ["link", "file", "book_reference"]);
export const billStatus = pgEnum("bill_status", ["unpaid", "paid", "skipped"]);
export const payFrequency = pgEnum("pay_frequency", ["weekly", "biweekly", "monthly"]);
export const eventStatus = pgEnum("event_status", [
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
]);
export const recurrenceFrequency = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
]);
export const timeLogParentType = pgEnum("time_log_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
]);
export const incomeKind = pgEnum("income_kind", ["paycheck", "misc"]);
export const taggableType = pgEnum("taggable_type", [
  "course",
  "project",
  "assignment",
  "task",
  "event",
  "bill",
  "note",
]);

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const userIdCol = () =>
  uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" });
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

const nonEmpty = (table: string, col: AnyPgColumn, colName: string) =>
  check(`${table}_${colName}_nonempty_chk`, sql`${col} IS NULL OR ${col} <> ''`);

export const recurrenceRules = pgTable(
  "recurrence_rules",
  {
    id: id(),
    frequency: recurrenceFrequency("frequency").notNull(),
    interval: integer("interval").notNull().default(1),
    daysOfWeek: integer("days_of_week").array(),
    endDate: date("end_date"),
    count: integer("count"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("recurrence_rules_interval_chk", sql`${t.interval} >= 1`),
    check("recurrence_rules_count_chk", sql`${t.count} IS NULL OR ${t.count} >= 1`),
    check(
      "recurrence_rules_days_of_week_chk",
      sql`${t.daysOfWeek} IS NULL OR (
        0 <= ALL(${t.daysOfWeek})
        AND 6 >= ALL(${t.daysOfWeek})
        AND array_is_sorted_asc_unique(${t.daysOfWeek})
      )`,
    ),
  ],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: id(),
    userId: userIdCol(),
    name: text("name").notNull(),
    type: workspaceType("type").notNull(),
    color: text("color"),
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("workspaces_user_name_uq").on(t.userId, t.name),
    index("workspaces_user_id_idx").on(t.userId),
    check("workspaces_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("workspaces", t.color, "color"),
    nonEmpty("workspaces", t.icon, "icon"),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: id(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: userIdCol(),
    name: text("name").notNull(),
    code: text("code"),
    instructor: text("instructor"),
    semester: text("semester"),
    credits: numeric("credits", { precision: 4, scale: 2 }),
    meetingSchedule: jsonb("meeting_schedule"),
    syllabusFilePath: text("syllabus_file_path"),
    syllabusName: text("syllabus_name"),
    syllabusUploadedAt: timestamp("syllabus_uploaded_at", { withTimezone: true }),
    color: text("color"),
    status: courseStatus("status").notNull().default("planned"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("courses_user_id_idx").on(t.userId),
    index("courses_workspace_id_idx").on(t.workspaceId),
    index("courses_user_status_idx").on(t.userId, t.status),
    check("courses_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("courses", t.code, "code"),
    nonEmpty("courses", t.instructor, "instructor"),
    nonEmpty("courses", t.semester, "semester"),
    nonEmpty("courses", t.syllabusFilePath, "syllabus_file_path"),
    nonEmpty("courses", t.syllabusName, "syllabus_name"),
    nonEmpty("courses", t.color, "color"),
    check(
      "courses_credits_chk",
      sql`${t.credits} IS NULL OR ${t.credits} >= 0`,
    ),
    check(
      "courses_dates_chk",
      sql`${t.startDate} IS NULL OR ${t.endDate} IS NULL OR ${t.startDate} <= ${t.endDate}`,
    ),
  ],
);

export const gradeCategories = pgTable(
  "grade_categories",
  {
    id: id(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    weight: numeric("weight", { precision: 5, scale: 2 }).notNull(),
    dropLowestN: integer("drop_lowest_n").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("grade_categories_course_id_idx").on(t.courseId),
    check("grade_categories_name_nonempty_chk", sql`${t.name} <> ''`),
    check(
      "grade_categories_weight_chk",
      sql`${t.weight} >= 0 AND ${t.weight} <= 100`,
    ),
    check("grade_categories_drop_lowest_n_chk", sql`${t.dropLowestN} >= 0`),
  ],
);

export const assignments = pgTable(
  "assignments",
  {
    id: id(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: userIdCol(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => gradeCategories.id, {
      onDelete: "set null",
    }),
    status: assignmentStatus("status").notNull().default("not_started"),
    pointsEarned: numeric("points_earned", { precision: 6, scale: 2 }),
    pointsPossible: numeric("points_possible", { precision: 6, scale: 2 }),
    notes: text("notes"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("assignments_user_id_idx").on(t.userId),
    index("assignments_course_id_idx").on(t.courseId),
    index("assignments_user_due_date_idx").on(t.userId, t.dueDate),
    index("assignments_user_status_due_date_idx").on(t.userId, t.status, t.dueDate),
    index("assignments_recurrence_rule_id_idx").on(t.recurrenceRuleId),
    check("assignments_title_nonempty_chk", sql`${t.title} <> ''`),
    nonEmpty("assignments", t.description, "description"),
    nonEmpty("assignments", t.notes, "notes"),
    check(
      "assignments_points_earned_chk",
      sql`${t.pointsEarned} IS NULL OR ${t.pointsEarned} >= 0`,
    ),
    check(
      "assignments_points_possible_chk",
      sql`${t.pointsPossible} IS NULL OR ${t.pointsPossible} >= 0`,
    ),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: id(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: userIdCol(),
    name: text("name").notNull(),
    description: text("description"),
    goal: text("goal"),
    status: projectStatus("status").notNull().default("planning"),
    priority: priority("priority").notNull().default("medium"),
    startDate: date("start_date"),
    targetDate: date("target_date"),
    color: text("color"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_user_id_idx").on(t.userId),
    index("projects_workspace_id_idx").on(t.workspaceId),
    index("projects_user_status_idx").on(t.userId, t.status),
    check("projects_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("projects", t.description, "description"),
    nonEmpty("projects", t.goal, "goal"),
    nonEmpty("projects", t.color, "color"),
    check(
      "projects_dates_chk",
      sql`${t.startDate} IS NULL OR ${t.targetDate} IS NULL OR ${t.startDate} <= ${t.targetDate}`,
    ),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    userId: userIdCol(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: taskStatus("status").notNull().default("not_started"),
    priority: priority("priority").notNull().default("medium"),
    parentTaskId: uuid("parent_task_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),
    notes: text("notes"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_user_id_idx").on(t.userId),
    index("tasks_project_id_idx").on(t.projectId),
    index("tasks_parent_task_id_idx").on(t.parentTaskId),
    index("tasks_user_due_date_idx").on(t.userId, t.dueDate),
    index("tasks_user_status_due_date_idx").on(t.userId, t.status, t.dueDate),
    index("tasks_recurrence_rule_id_idx").on(t.recurrenceRuleId),
    check("tasks_title_nonempty_chk", sql`${t.title} <> ''`),
    nonEmpty("tasks", t.description, "description"),
    nonEmpty("tasks", t.notes, "notes"),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: id(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    targetDate: date("target_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("milestones_project_id_idx").on(t.projectId),
    index("milestones_project_target_date_idx").on(t.projectId, t.targetDate),
    check("milestones_title_nonempty_chk", sql`${t.title} <> ''`),
    nonEmpty("milestones", t.description, "description"),
  ],
);

export const eventCategories = pgTable(
  "event_categories",
  {
    id: id(),
    userId: userIdCol(),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("event_categories_user_name_uq").on(t.userId, t.name),
    index("event_categories_user_id_idx").on(t.userId),
    check("event_categories_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("event_categories", t.color, "color"),
  ],
);

export const events = pgTable(
  "events",
  {
    id: id(),
    userId: userIdCol(),
    title: text("title").notNull(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => eventCategories.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    allDay: boolean("all_day").notNull().default(false),
    location: text("location"),
    url: text("url"),
    attendees: text("attendees"),
    status: eventStatus("status").notNull().default("confirmed"),
    color: text("color"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("events_user_id_idx").on(t.userId),
    index("events_user_starts_at_idx").on(t.userId, t.startsAt),
    index("events_category_id_idx").on(t.categoryId),
    index("events_recurrence_rule_id_idx").on(t.recurrenceRuleId),
    check("events_title_nonempty_chk", sql`${t.title} <> ''`),
    nonEmpty("events", t.description, "description"),
    nonEmpty("events", t.location, "location"),
    nonEmpty("events", t.url, "url"),
    nonEmpty("events", t.attendees, "attendees"),
    nonEmpty("events", t.color, "color"),
    check(
      "events_starts_ends_chk",
      sql`${t.endsAt} IS NULL OR ${t.startsAt} <= ${t.endsAt}`,
    ),
  ],
);

export const billCategories = pgTable(
  "bill_categories",
  {
    id: id(),
    userId: userIdCol(),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("bill_categories_user_name_uq").on(t.userId, t.name),
    index("bill_categories_user_id_idx").on(t.userId),
    check("bill_categories_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("bill_categories", t.color, "color"),
  ],
);

export const bills = pgTable(
  "bills",
  {
    id: id(),
    userId: userIdCol(),
    name: text("name").notNull(),
    description: text("description"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    categoryId: uuid("category_id").references(() => billCategories.id, {
      onDelete: "set null",
    }),
    dueDate: date("due_date").notNull(),
    status: billStatus("status").notNull().default("unpaid"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }),
    notes: text("notes"),
    color: text("color"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("bills_user_id_idx").on(t.userId),
    index("bills_user_due_date_idx").on(t.userId, t.dueDate),
    index("bills_user_status_due_date_idx").on(t.userId, t.status, t.dueDate),
    index("bills_category_id_idx").on(t.categoryId),
    index("bills_recurrence_rule_id_idx").on(t.recurrenceRuleId),
    check("bills_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("bills", t.description, "description"),
    nonEmpty("bills", t.notes, "notes"),
    nonEmpty("bills", t.color, "color"),
    check("bills_amount_chk", sql`${t.amount} >= 0`),
    check(
      "bills_paid_amount_chk",
      sql`${t.paidAmount} IS NULL OR ${t.paidAmount} >= 0`,
    ),
  ],
);

export const paySchedule = pgTable(
  "pay_schedule",
  {
    id: id(),
    userId: userIdCol(),
    frequency: payFrequency("frequency").notNull(),
    referenceDate: date("reference_date").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("pay_schedule_user_uq").on(t.userId)],
);

export const notes = pgTable(
  "notes",
  {
    id: id(),
    userId: userIdCol(),
    parentType: noteParentType("parent_type").notNull(),
    parentId: uuid("parent_id").notNull(),
    title: text("title"),
    content: jsonb("content").notNull().default(sql`'{}'::jsonb`),
    sessionDate: date("session_date"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("notes_user_id_idx").on(t.userId),
    index("notes_parent_idx").on(t.parentType, t.parentId),
    index("notes_user_parent_type_idx").on(t.userId, t.parentType),
    nonEmpty("notes", t.title, "title"),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: id(),
    userId: userIdCol(),
    parentType: resourceParentType("parent_type").notNull(),
    parentId: uuid("parent_id").notNull(),
    type: resourceType("type").notNull(),
    title: text("title"),
    url: text("url"),
    filePath: text("file_path"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("resources_user_id_idx").on(t.userId),
    index("resources_parent_idx").on(t.parentType, t.parentId),
    nonEmpty("resources", t.title, "title"),
    nonEmpty("resources", t.url, "url"),
    nonEmpty("resources", t.filePath, "file_path"),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: id(),
    userId: userIdCol(),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("tags_user_name_uq").on(t.userId, t.name),
    index("tags_user_id_idx").on(t.userId),
    check("tags_name_nonempty_chk", sql`${t.name} <> ''`),
    nonEmpty("tags", t.color, "color"),
  ],
);

export const taggings = pgTable(
  "taggings",
  {
    id: id(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    taggableType: taggableType("taggable_type").notNull(),
    taggableId: uuid("taggable_id").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("taggings_tag_id_idx").on(t.tagId),
    index("taggings_taggable_idx").on(t.taggableType, t.taggableId),
    uniqueIndex("taggings_unique_uq").on(t.tagId, t.taggableType, t.taggableId),
  ],
);

export const timeLogs = pgTable(
  "time_logs",
  {
    id: id(),
    userId: userIdCol(),
    loggableType: timeLogParentType("loggable_type").notNull(),
    loggableId: uuid("loggable_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    wasPomodoro: boolean("was_pomodoro").notNull().default(false),
    pomodoroIntervalMinutes: integer("pomodoro_interval_minutes"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("time_logs_user_id_idx").on(t.userId),
    index("time_logs_loggable_idx").on(t.loggableType, t.loggableId),
    index("time_logs_user_started_at_idx").on(t.userId, t.startedAt),
    uniqueIndex("time_logs_one_active_per_user_uq")
      .on(t.userId)
      .where(sql`${t.endedAt} IS NULL`),
    check(
      "time_logs_duration_chk",
      sql`${t.durationSeconds} IS NULL OR ${t.durationSeconds} >= 0`,
    ),
    check(
      "time_logs_pomodoro_chk",
      sql`${t.pomodoroIntervalMinutes} IS NULL OR ${t.pomodoroIntervalMinutes} > 0`,
    ),
    check(
      "time_logs_started_ended_chk",
      sql`${t.endedAt} IS NULL OR ${t.startedAt} <= ${t.endedAt}`,
    ),
    nonEmpty("time_logs", t.notes, "notes"),
  ],
);

export const incomeEntries = pgTable(
  "income_entries",
  {
    id: id(),
    userId: userIdCol(),
    kind: incomeKind("kind").notNull(),
    receivedDate: date("received_date").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    source: text("source"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("income_entries_user_id_idx").on(t.userId),
    index("income_entries_user_received_date_idx").on(t.userId, t.receivedDate),
    check("income_entries_amount_chk", sql`${t.amount} >= 0`),
    nonEmpty("income_entries", t.source, "source"),
    nonEmpty("income_entries", t.notes, "notes"),
  ],
);

export const inboxItems = pgTable(
  "inbox_items",
  {
    id: id(),
    userId: userIdCol(),
    content: text("content").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    triageAt: timestamp("triage_at", { withTimezone: true }),
    resultingItemType: text("resulting_item_type"),
    resultingItemId: uuid("resulting_item_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("inbox_items_user_id_idx").on(t.userId),
    index("inbox_items_user_captured_at_idx").on(t.userId, t.capturedAt),
    check("inbox_items_content_nonempty_chk", sql`${t.content} <> ''`),
    nonEmpty("inbox_items", t.resultingItemType, "resulting_item_type"),
  ],
);
