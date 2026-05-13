-- Apply this AFTER 02_triggers.sql.
-- Enables row-level security on every table and installs the §7.3.5 policies.
-- RLS is a backstop — the application layer is the primary enforcement (§7.3.5).

-- ---------------------------------------------------------------------------
-- Enable + force RLS on every table.
-- FORCE ensures even the table owner is subject to RLS (defense in depth).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'workspaces','recurrence_rules','courses','grade_categories','assignments',
    'projects','tasks','milestones','event_categories','events',
    'bill_categories','bills','pay_schedule','notes','resources',
    'tags','taggings','time_logs','income_entries','inbox_items'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Helper: replace a policy idempotently.
-- ---------------------------------------------------------------------------

-- Direct-owned tables: auth.uid() = user_id for all four operations.

drop policy if exists workspaces_owner on public.workspaces;
create policy workspaces_owner on public.workspaces
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists courses_owner on public.courses;
create policy courses_owner on public.courses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists assignments_owner on public.assignments;
create policy assignments_owner on public.assignments
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists projects_owner on public.projects;
create policy projects_owner on public.projects
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists tasks_owner on public.tasks;
create policy tasks_owner on public.tasks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists event_categories_owner on public.event_categories;
create policy event_categories_owner on public.event_categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists events_owner on public.events;
create policy events_owner on public.events
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bill_categories_owner on public.bill_categories;
create policy bill_categories_owner on public.bill_categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bills_owner on public.bills;
create policy bills_owner on public.bills
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists pay_schedule_owner on public.pay_schedule;
create policy pay_schedule_owner on public.pay_schedule
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notes_owner on public.notes;
create policy notes_owner on public.notes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists resources_owner on public.resources;
create policy resources_owner on public.resources
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists tags_owner on public.tags;
create policy tags_owner on public.tags
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists time_logs_owner on public.time_logs;
create policy time_logs_owner on public.time_logs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists income_entries_owner on public.income_entries;
create policy income_entries_owner on public.income_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists inbox_items_owner on public.inbox_items;
create policy inbox_items_owner on public.inbox_items
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Child tables: ownership inherited from the parent row.
-- ---------------------------------------------------------------------------

drop policy if exists grade_categories_owner on public.grade_categories;
create policy grade_categories_owner on public.grade_categories
  for all to authenticated
  using (
    exists (
      select 1 from public.courses
      where courses.id = grade_categories.course_id
        and courses.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses
      where courses.id = grade_categories.course_id
        and courses.user_id = auth.uid()
    )
  );

drop policy if exists milestones_owner on public.milestones;
create policy milestones_owner on public.milestones
  for all to authenticated
  using (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = milestones.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists taggings_owner on public.taggings;
create policy taggings_owner on public.taggings
  for all to authenticated
  using (
    exists (
      select 1 from public.tags
      where tags.id = taggings.tag_id
        and tags.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tags
      where tags.id = taggings.tag_id
        and tags.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- recurrence_rules: orphan-able rows referenced from four parent tables.
-- INSERT allowed for any authenticated user (the rule may be brand-new and
-- not yet attached); SELECT/UPDATE/DELETE require the rule to be referenced
-- from a row owned by the current user.
-- ---------------------------------------------------------------------------

drop policy if exists recurrence_rules_select on public.recurrence_rules;
create policy recurrence_rules_select on public.recurrence_rules
  for select to authenticated
  using (
    exists (select 1 from public.tasks       t where t.recurrence_rule_id = recurrence_rules.id and t.user_id = auth.uid())
    or exists (select 1 from public.assignments a where a.recurrence_rule_id = recurrence_rules.id and a.user_id = auth.uid())
    or exists (select 1 from public.events      e where e.recurrence_rule_id = recurrence_rules.id and e.user_id = auth.uid())
    or exists (select 1 from public.bills       b where b.recurrence_rule_id = recurrence_rules.id and b.user_id = auth.uid())
  );

drop policy if exists recurrence_rules_insert on public.recurrence_rules;
create policy recurrence_rules_insert on public.recurrence_rules
  for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists recurrence_rules_update on public.recurrence_rules;
create policy recurrence_rules_update on public.recurrence_rules
  for update to authenticated
  using (
    exists (select 1 from public.tasks       t where t.recurrence_rule_id = recurrence_rules.id and t.user_id = auth.uid())
    or exists (select 1 from public.assignments a where a.recurrence_rule_id = recurrence_rules.id and a.user_id = auth.uid())
    or exists (select 1 from public.events      e where e.recurrence_rule_id = recurrence_rules.id and e.user_id = auth.uid())
    or exists (select 1 from public.bills       b where b.recurrence_rule_id = recurrence_rules.id and b.user_id = auth.uid())
  );

drop policy if exists recurrence_rules_delete on public.recurrence_rules;
create policy recurrence_rules_delete on public.recurrence_rules
  for delete to authenticated
  using (
    exists (select 1 from public.tasks       t where t.recurrence_rule_id = recurrence_rules.id and t.user_id = auth.uid())
    or exists (select 1 from public.assignments a where a.recurrence_rule_id = recurrence_rules.id and a.user_id = auth.uid())
    or exists (select 1 from public.events      e where e.recurrence_rule_id = recurrence_rules.id and e.user_id = auth.uid())
    or exists (select 1 from public.bills       b where b.recurrence_rule_id = recurrence_rules.id and b.user_id = auth.uid())
  );
