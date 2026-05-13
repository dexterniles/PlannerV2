# Database migration apply order

The schema lives in `lib/db/schema.ts`. The Drizzle-generated migration alone
will not produce a working database — two referenced primitives (one CHECK
helper, one trigger function) are declared outside Drizzle's reach. Apply the
files in this order in the Supabase Dashboard → SQL Editor:

1. **`00_pre.sql`** — defines `array_is_sorted_asc_unique(int[])` (referenced
   by the `recurrence_rules.days_of_week` CHECK) and `set_updated_at()` (the
   shared trigger function from §7.2.3).
2. **`../migrations/0000_wide_hammerhead.sql`** — Drizzle-generated DDL: enums,
   20 tables, all FKs, all indexes, all CHECK constraints.
3. **`02_triggers.sql`** — attaches the shared `set_updated_at` trigger to
   every table (one shared function, twenty `BEFORE UPDATE` triggers).
4. **`03_rls.sql`** — enables row-level security on every table and installs
   the policies from §7.3.5. *(Written in Phase 3.)*

Re-running any of these is safe: `00_pre.sql` uses `CREATE OR REPLACE`,
`02_triggers.sql` drops the trigger before recreating it, and `03_rls.sql`
uses `DROP POLICY IF EXISTS` before each `CREATE POLICY`.

Never run `npm run db:migrate` locally — the project's standing rule is that
all SQL goes through the Supabase Dashboard.
