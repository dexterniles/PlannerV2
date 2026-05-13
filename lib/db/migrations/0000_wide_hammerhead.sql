CREATE TYPE "public"."assignment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('unpaid', 'paid', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('planned', 'active', 'completed', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('confirmed', 'tentative', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."income_kind" AS ENUM('paycheck', 'misc');--> statement-breakpoint
CREATE TYPE "public"."note_parent_type" AS ENUM('course', 'project', 'assignment', 'task', 'session', 'daily_log', 'standalone', 'event');--> statement-breakpoint
CREATE TYPE "public"."pay_frequency" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'paused', 'done');--> statement-breakpoint
CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."resource_parent_type" AS ENUM('course', 'project', 'assignment', 'task');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('link', 'file', 'book_reference');--> statement-breakpoint
CREATE TYPE "public"."taggable_type" AS ENUM('course', 'project', 'assignment', 'task', 'event', 'bill', 'note');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."time_log_parent_type" AS ENUM('course', 'project', 'assignment', 'task');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('academic', 'projects', 'custom');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"category_id" uuid,
	"status" "assignment_status" DEFAULT 'not_started' NOT NULL,
	"points_earned" numeric(6, 2),
	"points_possible" numeric(6, 2),
	"notes" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_title_nonempty_chk" CHECK ("assignments"."title" <> ''),
	CONSTRAINT "assignments_description_nonempty_chk" CHECK ("assignments"."description" IS NULL OR "assignments"."description" <> ''),
	CONSTRAINT "assignments_notes_nonempty_chk" CHECK ("assignments"."notes" IS NULL OR "assignments"."notes" <> ''),
	CONSTRAINT "assignments_points_earned_chk" CHECK ("assignments"."points_earned" IS NULL OR "assignments"."points_earned" >= 0),
	CONSTRAINT "assignments_points_possible_chk" CHECK ("assignments"."points_possible" IS NULL OR "assignments"."points_possible" >= 0)
);
--> statement-breakpoint
CREATE TABLE "bill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bill_categories_name_nonempty_chk" CHECK ("bill_categories"."name" <> ''),
	CONSTRAINT "bill_categories_color_nonempty_chk" CHECK ("bill_categories"."color" IS NULL OR "bill_categories"."color" <> '')
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2) NOT NULL,
	"category_id" uuid,
	"due_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'unpaid' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_amount" numeric(12, 2),
	"notes" text,
	"color" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_name_nonempty_chk" CHECK ("bills"."name" <> ''),
	CONSTRAINT "bills_description_nonempty_chk" CHECK ("bills"."description" IS NULL OR "bills"."description" <> ''),
	CONSTRAINT "bills_notes_nonempty_chk" CHECK ("bills"."notes" IS NULL OR "bills"."notes" <> ''),
	CONSTRAINT "bills_color_nonempty_chk" CHECK ("bills"."color" IS NULL OR "bills"."color" <> ''),
	CONSTRAINT "bills_amount_chk" CHECK ("bills"."amount" >= 0),
	CONSTRAINT "bills_paid_amount_chk" CHECK ("bills"."paid_amount" IS NULL OR "bills"."paid_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"instructor" text,
	"semester" text,
	"credits" numeric(4, 2),
	"meeting_schedule" jsonb,
	"syllabus_file_path" text,
	"syllabus_name" text,
	"syllabus_uploaded_at" timestamp with time zone,
	"color" text,
	"status" "course_status" DEFAULT 'planned' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_name_nonempty_chk" CHECK ("courses"."name" <> ''),
	CONSTRAINT "courses_code_nonempty_chk" CHECK ("courses"."code" IS NULL OR "courses"."code" <> ''),
	CONSTRAINT "courses_instructor_nonempty_chk" CHECK ("courses"."instructor" IS NULL OR "courses"."instructor" <> ''),
	CONSTRAINT "courses_semester_nonempty_chk" CHECK ("courses"."semester" IS NULL OR "courses"."semester" <> ''),
	CONSTRAINT "courses_syllabus_file_path_nonempty_chk" CHECK ("courses"."syllabus_file_path" IS NULL OR "courses"."syllabus_file_path" <> ''),
	CONSTRAINT "courses_syllabus_name_nonempty_chk" CHECK ("courses"."syllabus_name" IS NULL OR "courses"."syllabus_name" <> ''),
	CONSTRAINT "courses_color_nonempty_chk" CHECK ("courses"."color" IS NULL OR "courses"."color" <> ''),
	CONSTRAINT "courses_credits_chk" CHECK ("courses"."credits" IS NULL OR "courses"."credits" >= 0),
	CONSTRAINT "courses_dates_chk" CHECK ("courses"."start_date" IS NULL OR "courses"."end_date" IS NULL OR "courses"."start_date" <= "courses"."end_date")
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_categories_name_nonempty_chk" CHECK ("event_categories"."name" <> ''),
	CONSTRAINT "event_categories_color_nonempty_chk" CHECK ("event_categories"."color" IS NULL OR "event_categories"."color" <> '')
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"url" text,
	"attendees" text,
	"status" "event_status" DEFAULT 'confirmed' NOT NULL,
	"color" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_title_nonempty_chk" CHECK ("events"."title" <> ''),
	CONSTRAINT "events_description_nonempty_chk" CHECK ("events"."description" IS NULL OR "events"."description" <> ''),
	CONSTRAINT "events_location_nonempty_chk" CHECK ("events"."location" IS NULL OR "events"."location" <> ''),
	CONSTRAINT "events_url_nonempty_chk" CHECK ("events"."url" IS NULL OR "events"."url" <> ''),
	CONSTRAINT "events_attendees_nonempty_chk" CHECK ("events"."attendees" IS NULL OR "events"."attendees" <> ''),
	CONSTRAINT "events_color_nonempty_chk" CHECK ("events"."color" IS NULL OR "events"."color" <> ''),
	CONSTRAINT "events_starts_ends_chk" CHECK ("events"."ends_at" IS NULL OR "events"."starts_at" <= "events"."ends_at")
);
--> statement-breakpoint
CREATE TABLE "grade_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"drop_lowest_n" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_categories_name_nonempty_chk" CHECK ("grade_categories"."name" <> ''),
	CONSTRAINT "grade_categories_weight_chk" CHECK ("grade_categories"."weight" >= 0 AND "grade_categories"."weight" <= 100),
	CONSTRAINT "grade_categories_drop_lowest_n_chk" CHECK ("grade_categories"."drop_lowest_n" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inbox_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triage_at" timestamp with time zone,
	"resulting_item_type" text,
	"resulting_item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inbox_items_content_nonempty_chk" CHECK ("inbox_items"."content" <> ''),
	CONSTRAINT "inbox_items_resulting_item_type_nonempty_chk" CHECK ("inbox_items"."resulting_item_type" IS NULL OR "inbox_items"."resulting_item_type" <> '')
);
--> statement-breakpoint
CREATE TABLE "income_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "income_kind" NOT NULL,
	"received_date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"source" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "income_entries_amount_chk" CHECK ("income_entries"."amount" >= 0),
	CONSTRAINT "income_entries_source_nonempty_chk" CHECK ("income_entries"."source" IS NULL OR "income_entries"."source" <> ''),
	CONSTRAINT "income_entries_notes_nonempty_chk" CHECK ("income_entries"."notes" IS NULL OR "income_entries"."notes" <> '')
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestones_title_nonempty_chk" CHECK ("milestones"."title" <> ''),
	CONSTRAINT "milestones_description_nonempty_chk" CHECK ("milestones"."description" IS NULL OR "milestones"."description" <> '')
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_type" "note_parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"title" text,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"session_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_title_nonempty_chk" CHECK ("notes"."title" IS NULL OR "notes"."title" <> '')
);
--> statement-breakpoint
CREATE TABLE "pay_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"frequency" "pay_frequency" NOT NULL,
	"reference_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"goal" text,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"start_date" date,
	"target_date" date,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_name_nonempty_chk" CHECK ("projects"."name" <> ''),
	CONSTRAINT "projects_description_nonempty_chk" CHECK ("projects"."description" IS NULL OR "projects"."description" <> ''),
	CONSTRAINT "projects_goal_nonempty_chk" CHECK ("projects"."goal" IS NULL OR "projects"."goal" <> ''),
	CONSTRAINT "projects_color_nonempty_chk" CHECK ("projects"."color" IS NULL OR "projects"."color" <> ''),
	CONSTRAINT "projects_dates_chk" CHECK ("projects"."start_date" IS NULL OR "projects"."target_date" IS NULL OR "projects"."start_date" <= "projects"."target_date")
);
--> statement-breakpoint
CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" integer[],
	"end_date" date,
	"count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurrence_rules_interval_chk" CHECK ("recurrence_rules"."interval" >= 1),
	CONSTRAINT "recurrence_rules_count_chk" CHECK ("recurrence_rules"."count" IS NULL OR "recurrence_rules"."count" >= 1),
	CONSTRAINT "recurrence_rules_days_of_week_chk" CHECK ("recurrence_rules"."days_of_week" IS NULL OR (
        0 <= ALL("recurrence_rules"."days_of_week")
        AND 6 >= ALL("recurrence_rules"."days_of_week")
        AND array_is_sorted_asc_unique("recurrence_rules"."days_of_week")
      ))
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_type" "resource_parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"type" "resource_type" NOT NULL,
	"title" text,
	"url" text,
	"file_path" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_title_nonempty_chk" CHECK ("resources"."title" IS NULL OR "resources"."title" <> ''),
	CONSTRAINT "resources_url_nonempty_chk" CHECK ("resources"."url" IS NULL OR "resources"."url" <> ''),
	CONSTRAINT "resources_file_path_nonempty_chk" CHECK ("resources"."file_path" IS NULL OR "resources"."file_path" <> '')
);
--> statement-breakpoint
CREATE TABLE "taggings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"taggable_type" "taggable_type" NOT NULL,
	"taggable_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_nonempty_chk" CHECK ("tags"."name" <> ''),
	CONSTRAINT "tags_color_nonempty_chk" CHECK ("tags"."color" IS NULL OR "tags"."color" <> '')
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"parent_task_id" uuid,
	"notes" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_title_nonempty_chk" CHECK ("tasks"."title" <> ''),
	CONSTRAINT "tasks_description_nonempty_chk" CHECK ("tasks"."description" IS NULL OR "tasks"."description" <> ''),
	CONSTRAINT "tasks_notes_nonempty_chk" CHECK ("tasks"."notes" IS NULL OR "tasks"."notes" <> '')
);
--> statement-breakpoint
CREATE TABLE "time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"loggable_type" time_log_parent_type NOT NULL,
	"loggable_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"was_pomodoro" boolean DEFAULT false NOT NULL,
	"pomodoro_interval_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_logs_duration_chk" CHECK ("time_logs"."duration_seconds" IS NULL OR "time_logs"."duration_seconds" >= 0),
	CONSTRAINT "time_logs_pomodoro_chk" CHECK ("time_logs"."pomodoro_interval_minutes" IS NULL OR "time_logs"."pomodoro_interval_minutes" > 0),
	CONSTRAINT "time_logs_started_ended_chk" CHECK ("time_logs"."ended_at" IS NULL OR "time_logs"."started_at" <= "time_logs"."ended_at"),
	CONSTRAINT "time_logs_notes_nonempty_chk" CHECK ("time_logs"."notes" IS NULL OR "time_logs"."notes" <> '')
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "workspace_type" NOT NULL,
	"color" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_name_nonempty_chk" CHECK ("workspaces"."name" <> ''),
	CONSTRAINT "workspaces_color_nonempty_chk" CHECK ("workspaces"."color" IS NULL OR "workspaces"."color" <> ''),
	CONSTRAINT "workspaces_icon_nonempty_chk" CHECK ("workspaces"."icon" IS NULL OR "workspaces"."icon" <> '')
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_category_id_grade_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."grade_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_categories" ADD CONSTRAINT "bill_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_category_id_bill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."bill_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_schedule" ADD CONSTRAINT "pay_schedule_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_user_id_idx" ON "assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignments_course_id_idx" ON "assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "assignments_user_due_date_idx" ON "assignments" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "assignments_user_status_due_date_idx" ON "assignments" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "assignments_recurrence_rule_id_idx" ON "assignments" USING btree ("recurrence_rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bill_categories_user_name_uq" ON "bill_categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "bill_categories_user_id_idx" ON "bill_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bills_user_id_idx" ON "bills" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bills_user_due_date_idx" ON "bills" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "bills_user_status_due_date_idx" ON "bills" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "bills_category_id_idx" ON "bills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "bills_recurrence_rule_id_idx" ON "bills" USING btree ("recurrence_rule_id");--> statement-breakpoint
CREATE INDEX "courses_user_id_idx" ON "courses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "courses_workspace_id_idx" ON "courses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "courses_user_status_idx" ON "courses" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_categories_user_name_uq" ON "event_categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "event_categories_user_id_idx" ON "event_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_user_starts_at_idx" ON "events" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "events_category_id_idx" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_recurrence_rule_id_idx" ON "events" USING btree ("recurrence_rule_id");--> statement-breakpoint
CREATE INDEX "grade_categories_course_id_idx" ON "grade_categories" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "inbox_items_user_id_idx" ON "inbox_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "inbox_items_user_captured_at_idx" ON "inbox_items" USING btree ("user_id","captured_at");--> statement-breakpoint
CREATE INDEX "income_entries_user_id_idx" ON "income_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "income_entries_user_received_date_idx" ON "income_entries" USING btree ("user_id","received_date");--> statement-breakpoint
CREATE INDEX "milestones_project_id_idx" ON "milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "milestones_project_target_date_idx" ON "milestones" USING btree ("project_id","target_date");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_parent_idx" ON "notes" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "notes_user_parent_type_idx" ON "notes" USING btree ("user_id","parent_type");--> statement-breakpoint
CREATE UNIQUE INDEX "pay_schedule_user_uq" ON "pay_schedule" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "projects_user_status_idx" ON "projects" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "resources_user_id_idx" ON "resources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resources_parent_idx" ON "resources" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "taggings_tag_id_idx" ON "taggings" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "taggings_taggable_idx" ON "taggings" USING btree ("taggable_type","taggable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "taggings_unique_uq" ON "taggings" USING btree ("tag_id","taggable_type","taggable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_uq" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE INDEX "tasks_user_due_date_idx" ON "tasks" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "tasks_user_status_due_date_idx" ON "tasks" USING btree ("user_id","status","due_date");--> statement-breakpoint
CREATE INDEX "tasks_recurrence_rule_id_idx" ON "tasks" USING btree ("recurrence_rule_id");--> statement-breakpoint
CREATE INDEX "time_logs_user_id_idx" ON "time_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_logs_loggable_idx" ON "time_logs" USING btree ("loggable_type","loggable_id");--> statement-breakpoint
CREATE INDEX "time_logs_user_started_at_idx" ON "time_logs" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "time_logs_one_active_per_user_uq" ON "time_logs" USING btree ("user_id") WHERE "time_logs"."ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_user_name_uq" ON "workspaces" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");