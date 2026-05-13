-- Apply this AFTER the drizzle-generated migration.
-- Attaches the shared set_updated_at() trigger to every table.

do $$
declare
  t text;
  tables text[] := array[
    'workspaces',
    'recurrence_rules',
    'courses',
    'grade_categories',
    'assignments',
    'projects',
    'tasks',
    'milestones',
    'event_categories',
    'events',
    'bill_categories',
    'bills',
    'pay_schedule',
    'notes',
    'resources',
    'tags',
    'taggings',
    'time_logs',
    'income_entries',
    'inbox_items'
  ];
begin
  foreach t in array tables loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;
