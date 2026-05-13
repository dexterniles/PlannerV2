# Planner (v2 build)

**Read [BUILD_PROMPT.md](BUILD_PROMPT.md) before doing anything in this repo.** It is the complete specification — stack, schema, auth, design system, build order, and an appendix (§A1) with the logical data model.

This is a fresh ground-up build. There are no v1 source files to reference; everything is in `BUILD_PROMPT.md`.

## Standing rules
- Apply database migrations via the Supabase Dashboard → SQL Editor. Do NOT run `npm run db:migrate` locally.
- Never run destructive git commands without explicit confirmation.
- Run `npm run verify:deps` after any `npm install`.
