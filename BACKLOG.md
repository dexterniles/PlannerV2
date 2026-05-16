# Planner — Backlog

Post-build enhancements, organized into scopeable rounds. Each round is a
coherent, shippable unit. Pick a round (or part of one) to scope into work.

**Effort tag** (per item): `[UI-only]` schema+API already exist · `[API+UI]`
data model exists, needs endpoint+UI · `[schema]` needs a migration (owner
applies SQL via Supabase Dashboard).
**Round size**: S ≈ half-day · M ≈ 1–2 days · L ≈ 3+ days.

Guiding principle: favor features that **connect data we already have** over
new data. No bloat — see "Won't build" at the bottom.

Migrations required anywhere: **Round 5** (income categories) and **Round 7**
(profile display-name). Everything else is UI/API on the existing schema.

---

## Round 1 — Triage & Focus  ·  ✅ DONE 2026-05-15  ·  no migration
*Shipped: lib/server/data/agenda.ts (today/heatmap/overdue, open-only, rolling
UTC) → dashboard Today timeline + 21-day heatmap + interactive OverdueStrip
(complete / →tomorrow); Issues Status|Due grouping toggle; Calendar kind
filters. tsc/eslint/14 tests/build green.*

- [UI-only] **Unified "Today" timeline** on the dashboard — one chronological
  strip merging tasks/assignments due, events, and bills due today.
- [UI-only] **Due-date density heatmap** (next ~21 days) — thin row of day
  cells shaded by item count, to spot crunch weeks.
- [UI-only] **Overdue → actionable strip** — expand the Overdue card into a
  short list with inline complete/reschedule (not just a number).
- [UI-only] **Smart due-grouping on Issues** — toggle list grouping between
  Status and Overdue / Today / This week / Later.
- [UI-only] **Calendar kind filters** — show/hide tasks · assignments ·
  events · bills toggles.

## Round 2 — Tags & Saved Views  ·  size M  ·  no migration
*The biggest cross-cutting organizer: one dimension that's yours, not a fixed
taxonomy. `tags`/`taggings` API already exists (covers all entities except
income).*

- [API+UI] **Tag management** — create/rename/color tags; attach/detach on any
  taggable item (chip UI in detail panels + list filter).
- [UI-only] **Saved views** — persist a filter (status/label/due/parent) as a
  named entry in the sidebar.
- [UI-only] **Pinned items** in the sidebar (user-curated quick access).

## Round 3 — Events Depth  ·  size M  ·  no migration
- [UI-only] **Location / address** — in create dialog + editable in detail.
- [UI-only] **Customizable categories** (concert, dinner, race, …) — manage
  `event_categories` (name+color) + picker on create/detail.
- [UI-only] Expose `description`, `url`, `attendees`, `all_day`, `color`.
- [API+UI] **Recurrence picker** for events — *build the shared recurrence
  chip+popover component here; reused by Rounds 5 & 7.*

## Round 4 — Projects Depth  ·  size M–L  ·  no migration
- [UI-only] Surface `description` / `goal` / start–target dates in detail.
- [UI-only] **Task-rollup progress** (% done from child tasks) on row + detail.
- [UI-only] **Milestone progress bar** (target dates + completed count).
- [UI-only] **Next action** per project (soonest-due open task) on the list.
- [UI-only] **Project health** (on-track / at-risk / overdue) — computed from
  target date + progress.
- [API+UI] **Sub-tasks** — nested task UI (`tasks.parent_task_id` exists).

## Round 5 — Money Depth  ·  size M–L  ·  **migration required**
- [UI-only] **Bill categories** (subscriptions, utilities, business, …) —
  manage `bill_categories` + picker (table/API/`bills.category_id` exist).
- [schema] **Income categories** — new `income_categories` table +
  `income_entries.category_id` (mirrors bill/event pattern), then API + UI.
- [UI-only] Expose bill `description`/`color`/`paid_amount`, income
  `source`/`notes`.
- [UI-only] **Spend/earn by category** rollup (after categories exist).
- [UI-only] **Month in-vs-out trend** (~6 months) on the Money page.
- [API+UI] **Recurring bills** picker (reuses Round 3's recurrence component).

## Round 6 — Academic / Grades  ·  size M  ·  no migration
- [UI-only] **Assignment grade entry** — `points_earned`/`points_possible`
  in the detail panel.
- [UI-only] **Computed course grade** — weighted categories + `drop_lowest_n`.
- [UI-only] **Per-course grade breakdown** (category → assignments → running).
- [UI-only] **Course "this week" hub** — upcoming assignments + current grade.
- [UI-only] **Grade trajectory** sparkline on the dashboard (depends on the
  above).

## Round 7 — Parity & Polish  ·  size L  ·  one migration (display-name)
*Carried-over deferrals. Lower urgency; pick items à la carte.*

- [UI-only] Multi-select / bulk / `[`·`]` nav on Projects, Courses, Events
  (Issues-only today).
- [UI-only] Sidebar: expandable **workspace tree** (projects/courses nested) +
  working workspace switcher (scopes data).
- [UI-only] Detail-panel **tabs** (activity / notes / resources / sub-items).
- [API+UI] **Resources UI** — attach links/files/book refs to courses &
  projects (resources API done).
- [API+UI] **Notes attached to an entity** — create from a course/task/project
  panel (only standalone works in UI today).
- [UI-only] Per-item **time estimate vs logged** (time-logs exist).
- [UI-only] Start-timer on project/course detail; pomodoro prefs in Settings.
- [UI-only] Sidebar + detail-panel drag-resize.
- [schema] Profile **display-name** persistence (no column today).
- TipTap **@mention** autocomplete (stubbed).
- **Lighthouse / perf / a11y** audit (run in a real browser — owner).

---

## Won't build (deliberate anti-bloat)
Gamification / streaks, activity feeds, dashboard widget customization,
standalone analytics dashboards, AI summaries. They demo well and rot in real
use; this app's value is triage and connections, not charts for their own sake.

## Suggested order
1 → 2 → (3 / 4 / 6 in any order, by what you need first) → 5 → 7.
Rounds 1 & 2 give the most daily value per unit of work; do them first.
