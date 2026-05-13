# Planner v2 — Build Prompt

> Hand this entire document to your build agent / new project session. This is a **clean ground-up build**. The only thing carried forward from v1 is the *logical model* — captured in §A1 (Appendix). Do not copy, import, or reference any v1 source file. Every line in v2 is hand-written against this spec.

---

## 1. Project goal

You are building **Planner v2** — a personal planner. The feature set matches v1 (see §6, §A1). The UI is **Linear-inspired**: dense, monochrome, keyboard-first, with a persistent left sidebar, a Cmd+K command palette as the primary interaction, and a right-side detail panel that slides over the list (never a modal).

Auth is **multi-user with no public signup**. The owner provisions accounts manually through the Supabase Dashboard; the app only exposes a sign-in screen. Every authenticated user's data is fully isolated by `userId` at the query level.

This is a **fresh ground-up build**. Use the logical reference in §A1 to drive schema design, route inventory, and feature behavior. Do not copy v1 source files. The goal is to inherit zero accumulated bugs.

### 1.1 Project specifics

| | |
|---|---|
| Product name (displayed in UI) | **Planner** |
| Repo / directory name | **PlannerV2** |
| Package name in `package.json` | `planner-v2` (lowercase, npm convention) |
| Logo | `public/logo.svg` (or `public/logo.png` — owner will provide the file). Use it in the login card and the sidebar wordmark. Render at 24px height in the sidebar, 32px height on the login page. |
| Favicon | Derive from the same logo; place at `app/icon.png` (Next.js convention auto-wires it). |
| OG image | `app/opengraph-image.png` — owner will provide; agent should not generate a placeholder. |
| `<title>` / metadata | Root `app/layout.tsx` exports `metadata = { title: { default: 'Planner', template: '%s · Planner' }, description: 'Personal planner.' }`. Each page may override `title` (e.g. "Issues" → renders as "Issues · Planner"). |
| Test user (created in Supabase Dashboard) | `dexter.niles5@gmail.com` |
| Accent color | `oklch(0.62 0.18 270)` (light) / `oklch(0.70 0.16 270)` (dark) — locked, see §9 |
| Owner / sole admin | The test user above is the only account that will exist at launch; additional users are added manually in the Supabase Dashboard. |

If the logo file is not yet in `public/` when the agent starts working on the login page or sidebar, render a text wordmark "**Planner**" in `text-base font-semibold tracking-tight` as a placeholder, with a `TODO: replace with logo image at public/logo.svg` comment — the only TODO allowed in shipped code, and only until the file is dropped in.

---

## 2. Hard constraints (read first)

- **Next.js 16** has breaking changes from earlier versions. Before writing any routing, caching, middleware, or server-action code, read the relevant doc in `node_modules/next/dist/docs/`. Do not assume APIs from training data.
- **Tailwind CSS 4** has no `tailwind.config.js`. Theme tokens go in `app/globals.css` inside `@theme` blocks. Use `@import "tailwindcss";` at the top, not the v3 `@tailwind base/components/utilities` directives.
- **TypeScript strict** mode. No `any`. Use `z.infer<typeof Schema>` for inferred types.
- **No new feature scope** beyond what's listed here. Parity + the four consolidations in §6.
- **Multi-user, no public signup.** Accounts are provisioned in the Supabase Dashboard. The app exposes only a sign-in form. Every authenticated user gets their own private data. Scope every query by `userId` from the auth helper — never trust a `userId` from the client. No collaboration, sharing, or cross-user visibility (see §22).
- **Do not run `db:migrate` locally.** Apply SQL via Supabase Dashboard → SQL Editor. This is a standing user preference.

---

## 3. Stack (pin these)

| Layer | Choice | Version (pin) |
|---|---|---|
| Framework | Next.js (App Router, Server Components) | `16.2.4` exact |
| Runtime | React + React DOM | `19.2.4` exact |
| Language | TypeScript strict | `^5.7.0` |
| Styling | Tailwind CSS (PostCSS pipeline, no JS config) | `^4.0.0` |
| Tailwind PostCSS | @tailwindcss/postcss | `^4.0.0` |
| UI primitives | shadcn — `new-york` style, neutral base, CSS variables | latest CLI |
| Icons | lucide-react | `^0.460.0` |
| DB | Postgres via Supabase | — |
| ORM | drizzle-orm | **`0.45.2` exact** (pre-1.0) |
| ORM CLI | drizzle-kit | **`0.31.10` exact** (pre-1.0) |
| Auth (SSR) | @supabase/ssr | `^0.10.0` |
| Auth (client) | @supabase/supabase-js | `^2.103.0` |
| Client cache | @tanstack/react-query | `^5.99.0` |
| Validation | zod | `^4.0.0` |
| Forms | react-hook-form + @hookform/resolvers | `^7.72.0` / `^5.2.0` |
| Command palette | cmdk | `^1.0.0` |
| Animation | motion (the React 19-compatible package — **not** `framer-motion`) | **`^11.15.0` exact-minor** |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/sortable | `^6.3.0` / `^10.0.0` |
| Panel layout | react-resizable-panels | `^2.1.0` |
| Mobile drawer | vaul | `^1.1.0` |
| Rich text | @tiptap/react + starter-kit + task-list + task-item + placeholder + link + mention | `^2.10.0` (matched set) |
| Keyboard | react-hotkeys-hook | `^4.6.0` |
| Date math | date-fns | `^3.6.0` |
| NL date parsing | chrono-node | `^2.9.0` |
| Toasts | sonner | `^2.0.0` |
| Theme | next-themes | `^0.4.0` |
| Analytics | @vercel/analytics + @vercel/speed-insights | `^2.0.0` |

### 3.1 Pre-flight checks (run after `npm install`)

Before writing any feature code, run these checks. If any fails, stop and fix.

```bash
# 1. Verify React 19 propagated everywhere (catches a "phantom React 18" in nested deps)
npm ls react react-dom

# 2. Verify motion resolved to a React 19-compatible build
node -e "const p=require('motion/package.json'); console.log(p.name, p.version, p.peerDependencies?.react)"
# Expect: react peer ">=18" or ">=19", and version 11.15+

# 3. Verify Tailwind 4 is what got installed (NOT v3)
node -e "console.log(require('tailwindcss/package.json').version)"
# Expect: 4.x.x

# 4. Verify drizzle versions are exact (no caret bumps allowed)
node -e "const p=require('./package.json'); console.log(p.dependencies['drizzle-orm'], p.devDependencies['drizzle-kit'])"
# Expect: 0.45.2 and 0.31.10 — no ^ or ~ prefix

# 5. Verify Supabase ssr is on 0.10+ (older versions have a different cookie API)
npm ls @supabase/ssr
```

Add this to `package.json` as a single script so it can re-run after every install:

```json
{
  "scripts": {
    "verify:deps": "npm ls react react-dom && node scripts/verify-deps.mjs"
  }
}
```

### 3.2 Upgrade rituals

- **Never** run `npm update` against `drizzle-orm`, `drizzle-kit`, or `motion`. Bump these one at a time, read the changelog, run `npm run db:generate` (Drizzle) or visually QA an animation page (motion), then commit.
- For **shadcn** components, prefer `npx shadcn@latest add <component>` over editing existing components — the generator stays in sync with current Radix versions.
- For **Tailwind 4**, watch upstream PostCSS plugin changes. The plugin name is `@tailwindcss/postcss`; do not import `tailwindcss` directly into `postcss.config.mjs`.
- For **Supabase**, the `@supabase/ssr` cookie API changed in 0.6 → 0.10. Pin a major-minor floor (`^0.10.0`) and verify the cookie handlers in `lib/supabase/middleware.ts` after any bump.

### 3.3 Tailwind 4 syntax cheat sheet (the build agent must follow this)

v4 is intentionally different from v3. Common v3 patterns that will break or silently misbehave:

| ❌ v3 (don't write) | ✅ v4 (do write) |
|---|---|
| `tailwind.config.js` with `theme.extend` | `app/globals.css` with `@theme { … }` |
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| `darkMode: 'class'` in JS config | `@variant dark (&:where(.dark, .dark *));` in CSS |
| `extend.colors: { brand: '#...' }` | `@theme { --color-brand: oklch(…); }` (creates `bg-brand`, `text-brand`, etc.) |
| `plugins: [require('@tailwindcss/typography')]` | `@plugin "@tailwindcss/typography";` in CSS |
| PostCSS: `tailwindcss: {}` | PostCSS: `'@tailwindcss/postcss': {}` |
| Arbitrary values use brackets only | Arbitrary properties and values both work the same as v3 |

Before writing any Tailwind code, read `node_modules/tailwindcss/dist/lib/index.css` (small) and skim the official v4 upgrade guide if reachable.

**Do not add**: Zustand, Jotai, Redux, styled-components, emotion, Prisma, Sequelize, axios. React Query + Context covers global state; Tailwind 4 covers styling; Drizzle covers data; native fetch covers HTTP.

---

## 4. Repo structure

```
app/
  (app)/
    layout.tsx                  # AppShell: sidebar + main + detail-panel slot
    page.tsx                    # Dashboard
    issues/page.tsx             # consolidates tasks + assignments
    issues/[id]/page.tsx
    projects/page.tsx
    projects/[id]/page.tsx
    courses/page.tsx
    courses/[id]/page.tsx
    events/page.tsx
    money/page.tsx              # consolidates bills + income
    notes/page.tsx
    calendar/page.tsx
    settings/page.tsx
  login/page.tsx
  api/
    auth/logout/route.ts
    health/route.ts
    cron/auto-complete/route.ts
    items/route.ts              # unified issues query (§8)
    tasks/...                   # full route list in §A1.4
    [...]
  layout.tsx                    # root: fonts, providers
  globals.css                   # Tailwind 4 @theme, design tokens
proxy.ts                        # session refresh + header stamping (§5)
components/
  layout/
    AppShell.tsx
    Sidebar.tsx
    Topbar.tsx
    DetailPanel.tsx
    CommandPalette.tsx
    ShortcutHelp.tsx
  ui/                           # shadcn primitives (added via CLI as needed)
  features/
    issues/
    projects/
    courses/
    events/
    money/
    notes/
    calendar/
    dashboard/
  shared/
    StatusPill.tsx
    PriorityChip.tsx
    LabelChip.tsx
    DueDate.tsx
    Kbd.tsx
    EmptyState.tsx
    ListView.tsx
    DetailHeader.tsx
lib/
  db/
    schema.ts                   # designed fresh against §A1 + invariants in §7.2
    migrations/                 # one initial migration generated by drizzle-kit
    client.ts                   # drizzle client
  server/
    auth.ts                     # getServerAuth() (§5)
    data/                       # one file per domain; see invariants in §7.3
  auth/
    require-auth.ts             # (§5)
    ownership.ts                # (§7.3)
  supabase/
    server.ts
    browser.ts
    middleware.ts
  validations/                  # one zod schema file per domain
  keymap/
    registry.ts                 # central shortcut definitions
    scopes.ts
    use-keymap.ts
  hooks/                        # all use-* client hooks
  utils/
    cn.ts
    dates.ts
scripts/
  seed.ts
vercel.json
.env.example
```

---

## 5. Auth (multi-user, no public signup)

Accounts are created manually in the Supabase Dashboard. The app never exposes a signup, password-reset, or self-service path. There is no allowlist — any user with a valid Supabase session is allowed through.

- `proxy.ts` refreshes the Supabase session via `updateSession()`; if no session, redirects to `/login?next=…`.
- Verified user id + email forwarded via `x-auth-user-id` and `x-auth-user-email` headers, set on the same `NextResponse.next({ request })` call that propagates refreshed cookies.
- Every API route calls `requireAuthGuard(request)` from `lib/auth/require-auth.ts` — returns 401 if headers absent, returns `{ userId, email }` otherwise.
- Server components call `getServerAuth()` from `lib/server/auth.ts`.
- Excluded from auth in proxy matcher: `/login`, `/api/health`, `/api/auth/logout`, `/api/cron/*`, static assets, image assets.

### Sign-in page (`/login`)
The only auth surface in the app. Styled to match the Linear-inspired design system (see §9).

- Centered card, max-width 380px, on the page background
- Card: `bg-bg-elevated`, 1px border, `radius-md`, `shadow-sm`, 32px padding
- Top of card: the Planner logo (`public/logo.svg`) at 32px height, centered, with a 13px muted subtitle "Sign in to continue" below it. If the logo file is missing at build time, fall back to the text wordmark per §1.1.
- Two stacked fields:
  - Email — `<input type="email" required autoFocus>` using the shadcn Input primitive
  - Password — `<input type="password" required>` using the shadcn Input primitive
- Primary button "Sign in", full width, uses the accent color
- Error state inline below the form (12px, `--color-status-blocked`): "Incorrect email or password." Generic message — never disclose which field is wrong.
- Submit handler calls `supabase.auth.signInWithPassword({ email, password })`. On success, redirect to `?next=…` or `/`. On error, set the inline error and keep the email field populated.
- Pending state: button shows a spinner; both fields disabled.
- **No "Sign up" link. No "Forgot password" link. No magic-link / OAuth buttons.**
- Theme toggle in the bottom-right corner of the viewport so the page works in dark + light from a cold visit.
- All form interactions keyboard-only-usable: Tab order email → password → submit; Enter submits.

### New-user onboarding
First time a Supabase-provisioned user signs in, server-side check on the dashboard load: does the user have any workspaces? If not, run a server action `bootstrapNewUser(userId)` that creates:
- One workspace named "Personal" (type=`custom`, default)
- One workspace named "Academic" (type=`academic`)
- One workspace named "Projects" (type=`projects`)

Ownership enforcement details — including the 404-not-403 rule and RLS policy shape — live in §7.3.

---

## 6. Feature surface

Ten feature domains. Three of them are UI consolidations — the API layer keeps separate endpoints, the consolidation lives only in the views.

### Domains
1. Workspaces (academic / projects / custom)
2. Courses + grade categories + assignments + syllabi (stored in Supabase Storage bucket `syllabi`, 10MB, PDF/DOC/MD only)
3. Projects + nested tasks + milestones
4. Events + event categories
5. Bills + bill categories
6. Income + pay schedule (weekly/biweekly/monthly)
7. Time logs (one active timer per user, pomodoro support, polymorphic loggable)
8. Notes (polymorphic, parent = course/project/assignment/task/session/daily_log/standalone/event)
9. Resources (polymorphic, parent = course/project/assignment/task; type = link/file/book_reference)
10. Tags + polymorphic taggings

### Consolidations (UI only)
1. **Issues** = unified Tasks + Assignments. Same DB tables. Single list view with a `kind` filter and a `source` chip showing the parent project or course. New endpoint `GET /api/items` aggregates across both with a consistent shape.
2. **Money** = unified Bills + Income. Two tabs (`Out` / `In`) under one route. Pay schedule, bill calendar, and income entries live together.
3. **Notes** elevated to a top-level surface. Filter by attached-to-X vs standalone.

### Background work
- `/api/cron/auto-complete` — daily at 04:00 UTC, Bearer auth via `CRON_SECRET`. Marks past courses/events complete; materializes recurring tasks/assignments/events/bills 14 days out. See §16.

---

## 7. Data model (fresh build)

Design `lib/db/schema.ts` from scratch using the table list, columns, and enums in §A1. Generate **one** initial migration with `drizzle-kit generate`, review the SQL by hand against §7.2, then apply via Supabase Dashboard → SQL Editor. Commit the generated SQL.

### 7.1 Tables to create

The 19 tables in §A1.1 plus the `inbox_items` table (kept in the schema for forward-compatibility; no UI surfaces it).

### 7.2 Schema invariants — non-negotiable, apply to every table

1. Primary key: `id uuid primary key default gen_random_uuid()`
2. Every user-owned row table has `user_id uuid not null references auth.users(id) on delete cascade`
3. Every table has `created_at timestamptz not null default now()` and `updated_at timestamptz not null default now()`. Install one shared trigger (`set_updated_at()`) and attach it to every table — no per-table inline trigger functions.
4. Every foreign key declares `on delete` explicitly: `cascade` for owned children (e.g. `tasks.project_id`), `set null` for optional references (e.g. `assignments.category_id`), `restrict` for required parents that should not silently disappear.
5. Every enum is declared as a Postgres `enum type` via Drizzle's `pgEnum` — no raw text columns with CHECK constraints.
6. Polymorphic parent tables (`notes`, `resources`, `taggings`, `time_logs`, `inbox_items`) have:
   - A CHECK constraint pinning `parent_type` (or `taggable_type`, etc.) to the enum values
   - A composite index on `(parent_type, parent_id)` for lookup
   - The parent id is `uuid not null` (not text)
7. Composite indexes for the common access patterns, in this exact column order:
   - `(user_id, due_date)` on `tasks`, `assignments`, `bills`
   - `(user_id, starts_at)` on `events`
   - `(user_id, status, due_date)` on `tasks`, `assignments`, `bills`
   - `(user_id, received_date)` on `income_entries`
   - Partial unique index on `time_logs` `(user_id) WHERE ended_at IS NULL` — enforces one active timer per user at the DB level
8. Money columns use `numeric(12, 2)` — never `decimal`, `real`, or `double precision`.
9. Date-only columns use `date`; instants use `timestamptz`; never `timestamp` without zone.
10. Optional text columns are `text` (not `varchar(n)`); empty string is not allowed — use `NULL` when absent (enforced by `CHECK (col <> '')` on every nullable text column).
11. Every table that participates in recurrence (`tasks`, `assignments`, `events`, `bills`) has nullable `recurrence_rule_id uuid references recurrence_rules(id) on delete set null` plus an index on it.
12. `assignments.points_earned` and `points_possible`: `numeric(6, 2)`, both nullable; CHECK `(points_earned IS NULL OR points_earned >= 0)` and same for possible.
13. `grade_categories.weight`: `numeric(5, 2)` with CHECK `(weight >= 0 AND weight <= 100)`; `drop_lowest_n`: `int not null default 0` with CHECK `>= 0`.
14. `recurrence_rules.days_of_week`: `int[]` with CHECK that each element is in `[0..6]` (0 = Sunday) and the array is sorted ascending (or `NULL` when not weekly).

### 7.3 Data-access invariants — load-bearing for the auth model

These are not stylistic preferences. The whole multi-user model depends on them being followed in every code path.

1. **Every read** in `lib/server/data/*` filters by `userId` from the auth helper. No exceptions, including "internal" helpers — there is no internal call site that's exempt.
2. **Every write** derives `userId` from the auth helper, never from request body, query string, or path param.
3. **Cross-resource access** (e.g. "list tasks for project X") goes through `lib/auth/ownership.ts`. The helper takes `(userId, kind, id)` and returns `boolean` or throws `NotFound`. Routes call this before fetching children.
4. **Not found ≠ forbidden.** If a user requests an item that exists but belongs to another user, return 404 — never 403. Existence is itself information.
5. **RLS is a backstop, not the primary check.** Enable RLS on every table. Add policies that mirror the application logic:
   - Direct-owned rows (`user_id` column): `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE
   - Child rows without their own `user_id` (`grade_categories`, `milestones`, `taggings`): `EXISTS (SELECT 1 FROM <parent> WHERE id = <fk> AND user_id = auth.uid())`
6. **Service-role key** is used only in: cron handlers (where the request is not user-bound), the `bootstrapNewUser` server action (which must bypass RLS to create initial workspaces), and one-shot scripts. It is NEVER imported from a request-handling route, server component, or client.
7. **No "trust the route handler" shortcuts.** Each data function is responsible for its own userId scoping. If a route handler forgets to pass userId, the data function fails closed (throws on missing userId).

### 7.4 Migration workflow

- Schema lives in `lib/db/schema.ts`. Run `npx drizzle-kit generate` to produce SQL.
- Review the generated SQL for: explicit `on delete` on every FK, no missing CASCADE, indexes named explicitly (not `idx_xxx_random`), no surprise default values.
- Apply the SQL via Supabase Dashboard → SQL Editor. Commit both `schema.ts` and the generated SQL file.
- After applying, run `npx drizzle-kit check` to confirm the migration history is clean.

---

## 8. API layer

Build the routes listed in §A1.4 from scratch. Keep `/api/tasks` and `/api/assignments` (and `/api/bills`, `/api/income`) separate at the API layer — consolidation is UI-only.

Add **one** new endpoint not in v1:
- `GET /api/items?kinds=task,assignment&projectId=…&courseId=…&status=…&priority=…&dueBefore=…&label=…&q=…` — unified query for the Issues view. Returns a discriminated union `{ kind: 'task' | 'assignment', ... }` with consistent fields: `id, kind, title, status, priority, dueDate, parentId, parentType, parentName, labels[]`.

### 8.1 Route handler contract

Every route follows this shape:

```ts
export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);              // 1
  const params = QuerySchema.safeParse(...);                  // 2
  if (!params.success) return errorResponse('validation', params.error);
  const data = await getThings(auth.userId, params.data);     // 3 — userId scoping inside
  return successResponse(data);                               // 4
}
```

1. Call `requireAuthGuard(request)` → `{ userId, email }` or 401.
2. Validate input with the zod schema in `lib/validations/<domain>.ts`.
3. Call the data function with `userId` as the first argument. The data function scopes the query itself (§7.3.1). Ownership for nested resources is checked via `lib/auth/ownership.ts`.
4. Return via the envelope helpers in §8.2.

### 8.2 Response envelope

All routes return one of these two shapes. Define helpers in `lib/server/api-response.ts`:

```ts
// Success
{ data: T }

// Error
{ error: { code: ErrorCode; message: string; fields?: Record<string, string[]> } }
```

`ErrorCode` is a union: `'validation' | 'unauthorized' | 'not_found' | 'conflict' | 'rate_limited' | 'internal'`.

Status codes:
| Code | When |
|---|---|
| 200 | Successful GET/PATCH/DELETE |
| 201 | Successful POST that created a row |
| 400 | `validation` — body fails zod parse; include `fields` mapping |
| 401 | `unauthorized` — auth guard missing or invalid |
| 404 | `not_found` — row absent OR belongs to another user (§7.3.4) |
| 409 | `conflict` — unique constraint violation (e.g. duplicate workspace name) |
| 429 | `rate_limited` — reserved; not enforced in v2 |
| 500 | `internal` — everything else; never include stack traces in the response |

The `message` field is human-readable English. The client never displays it to the user except for `validation` errors; other codes drive in-app messaging.

Never return more fields than the route's typed response shape declares. Use Drizzle's `.select({ id: …, title: … })` rather than selecting `*`.

---

## 9. Design system (Linear-inspired)

All tokens live in `app/globals.css` inside `@theme { ... }` blocks. Define both light and dark via the `.dark` class (next-themes uses class strategy — do NOT also use `prefers-color-scheme`, it fights the toggle).

### 9.0 Required `globals.css` structure (order matters)

The shadcn CLI writes its own `@theme` block on init. Your overrides MUST come **after** it, or shadcn's defaults win the cascade. Use this exact layout:

```css
/* 1. Tailwind import first */
@import "tailwindcss";

/* 2. shadcn-generated block — leave intact, do not edit inline */
@layer base {
  :root {
    /* shadcn neutral defaults — auto-written by CLI */
  }
  .dark {
    /* shadcn neutral dark defaults — auto-written by CLI */
  }
}

/* 3. Dark variant declaration (v4 syntax) */
@variant dark (&:where(.dark, .dark *));

/* 4. YOUR theme tokens — overrides shadcn above */
@theme {
  --color-bg: oklch(0.99 0 0);
  --color-bg-elevated: oklch(0.97 0 0);
  /* … all tokens from §9 below … */
}

/* 5. Dark-mode token overrides */
.dark {
  --color-bg: oklch(0.14 0 0);
  --color-bg-elevated: oklch(0.17 0 0);
  /* … all dark overrides … */
}

/* 6. Base element styles last */
@layer base {
  body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
}
```

**Why this order**: shadcn writes `--background`, `--foreground`, etc., which its primitives reference. Your `--color-bg` etc. are new variables that drive new utilities (`bg-bg`, `text-text`). Both coexist; just don't try to redefine shadcn's variables in your `@theme` block — override them in the `.dark` / `:root` rules instead if needed.

### Color palette (OKLch)

```css
@theme {
  --color-bg: oklch(0.99 0 0);
  --color-bg-elevated: oklch(0.97 0 0);
  --color-bg-hover: oklch(0.96 0 0);
  --color-border: oklch(0.93 0 0);
  --color-border-strong: oklch(0.88 0 0);
  --color-text: oklch(0.20 0 0);
  --color-text-muted: oklch(0.50 0 0);
  --color-text-subtle: oklch(0.65 0 0);

  --color-accent: oklch(0.62 0.18 270);            /* blue-purple, used sparingly */
  --color-accent-hover: oklch(0.58 0.19 270);
  --color-accent-text: oklch(0.99 0 0);

  --color-status-todo: oklch(0.55 0 0);
  --color-status-in-progress: oklch(0.72 0.14 75); /* amber */
  --color-status-done: oklch(0.65 0.15 145);       /* green */
  --color-status-cancelled: oklch(0.50 0 0);
  --color-status-blocked: oklch(0.62 0.20 25);     /* red */

  --color-priority-1: oklch(0.62 0.20 25);
  --color-priority-2: oklch(0.72 0.14 75);
  --color-priority-3: oklch(0.62 0.10 230);
  --color-priority-4: oklch(0.55 0 0);

  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-panel: 0 8px 32px rgba(0,0,0,0.10);

  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;
}

.dark {
  --color-bg: oklch(0.14 0 0);
  --color-bg-elevated: oklch(0.17 0 0);
  --color-bg-hover: oklch(0.19 0 0);
  --color-border: oklch(0.22 0 0);
  --color-border-strong: oklch(0.28 0 0);
  --color-text: oklch(0.95 0 0);
  --color-text-muted: oklch(0.65 0 0);
  --color-text-subtle: oklch(0.50 0 0);
  --color-accent: oklch(0.70 0.16 270);
  --color-accent-hover: oklch(0.75 0.17 270);
}
```

### Typography

- Sans: Inter Variable
- Mono: JetBrains Mono Variable
- **Drop EB Garamond.** No serif anywhere.
- Body default: `text-sm` (13px) — Linear is intentionally dense
- Sizes (override Tailwind defaults via @theme): `xs 11px, sm 12px, base 13px, lg 15px, xl 18px, 2xl 22px, 3xl 28px`
- All numeric columns get `font-variant-numeric: tabular-nums`
- Line-height tight on UI labels (`leading-tight`), normal on prose

### Spacing & geometry

- Rows in list views: 36px tall
- Sidebar items: 28px tall
- Topbar: 44px tall
- Sidebar default width: 240px (resizable 200–360px); collapses to 56px
- Detail panel default width: 480px (resizable 360–720px)
- Border radius: 6px base, 8px on cards, 10px on floating panels
- Borders: always 1px solid `var(--color-border)`
- Shadows: extremely subtle. One elevation for cards (`shadow-sm`), one for floating panels (`shadow-panel`)

### Motion

Use `motion` (the React 19-compatible Framer Motion fork).

- Default spring: `{ type: 'spring', stiffness: 380, damping: 32 }`
- Detail-panel slide-in: 220ms ease-out, slide from right + fade
- List row hover: 60ms — must feel instant
- Page transitions: 120ms cross-fade only (no slide)
- Command palette open: spring on the panel, instant on the backdrop
- Status / priority pill change: 150ms color-only transition; no layout shift

---

## 10. Layout primitives

### AppShell
Three-column grid via `react-resizable-panels`:
- **Sidebar** (left, 240px default, collapsible to 56px, resizable 200–360px)
- **Main** (flex)
- **DetailPanel** (right, 480px default, hidden by default, resizable 360–720px)

Below 768px viewport: sidebar becomes a `vaul` drawer; detail panel becomes a full-screen `vaul` sheet.

### Sidebar
Sections (in order):
1. Logo + product name (top, 44px) — `public/logo.svg` at 24px height, then "Planner" wordmark in `text-sm font-semibold tracking-tight`. Hidden when sidebar is collapsed to 56px; only the logo remains, centered.
2. Workspace switcher (32px)
3. Pinned items (user-curated)
4. Smart sections: My Issues, Calendar, Events, Money, Notes
5. Workspaces tree (collapsible, shows projects/courses under each)
6. Bottom: theme toggle + user menu

Each item: 28px tall, icon left (16px), label, optional count badge right. Active item gets a 2px left accent bar and `bg-bg-hover`.

### Topbar (44px)
- Left: collapse-sidebar toggle, breadcrumbs (workspace › item)
- Center: empty (search lives in Cmd+K only — keep the topbar quiet)
- Right: active-timer chip (if any), search hint (`⌘K`), theme toggle, avatar menu

### DetailPanel
- Route-driven via search params: `?detail=task:abc123`
- Sliding in/out updates URL; ESC closes; clicking outside does NOT close
- Header: parent breadcrumb + title (inline-editable) + status row (status pill, priority chip, due date, labels)
- Body: description (TipTap), then activity / sub-items / notes / resources tabs
- Footer: created/updated timestamps, delete button (with confirm)

### CommandPalette
- `cmdk` + Radix Dialog overlay
- Opens with `Cmd+K` from anywhere
- Three modes, switched by typing:
  - **Navigation** (default) — fuzzy-matched routes and recent items
  - **Action** — typed prefix like `>` opens the action list (Create issue, Set status, Assign, Schedule, …)
  - **Search** — typed prefix `?` hits the server search endpoint
- Groups: Issues, Projects, Courses, Events, Bills, Notes, Actions, Recent
- Each result row: kind icon + title + breadcrumb (small, muted) + shortcut hint
- Keyboard: ↑/↓ to navigate, Enter to execute, `Tab` to switch mode, Esc to close

---

## 11. Keyboard system

Central registry at `lib/keymap/registry.ts`:

```ts
type Shortcut = {
  id: string;
  keys: string;          // react-hotkeys-hook format
  description: string;
  scope: 'global' | 'list' | 'detail' | 'editor';
  handler: (ctx: KeymapContext) => void;
};
```

Mount the active shortcuts via `useHotkeys` in `useKeymap(scope)` hook. `Cmd+/` opens a sheet listing all shortcuts in the current scope, grouped.

### Global
| Keys | Action |
|---|---|
| `⌘K` | Command palette |
| `⌘/` | Shortcut help |
| `g i` | Go to Issues |
| `g p` | Go to Projects |
| `g c` | Go to Courses |
| `g e` | Go to Events |
| `g $` | Go to Money |
| `g n` | Go to Notes |
| `g k` | Go to Calendar |
| `c` | Create issue (context-aware) |
| `t` | Toggle theme |
| `Esc` | Close detail panel / clear selection |

### List scope
| Keys | Action |
|---|---|
| `j` / `k` | Move down / up |
| `x` | Toggle selection |
| `⇧j` / `⇧k` | Range select |
| `Enter` | Open in detail panel |
| `o` | Open inline |
| `e` | Edit inline |
| `Backspace` | Delete (confirm) |
| `s t` / `s p` / `s d` / `s c` | Set status: todo / in-progress / done / cancelled |
| `1`–`4` | Set priority |
| `d` | Set due date (inline picker, chrono-parsed) |
| `l` | Set label |
| `/` | Filter current list |
| `r` | Refresh |

### Detail scope
| Keys | Action |
|---|---|
| `Esc` | Close panel |
| `⌘Enter` | Save / submit |
| `[` / `]` | Previous / next item in list |
| `t` | Start timer for this item |
| `m` | Move to project/course |

### Editor scope (TipTap)
Standard editor shortcuts; do NOT let them bubble to global handlers.

---

## 12. Components to build

These ship before any feature page (build once, reuse everywhere):

- **StatusPill** — color dot + label, 5 states
- **PriorityChip** — 4-bar icon, level-indexed fill, text on hover
- **LabelChip** — colored dot + name, removable variant
- **DueDate** — relative ("in 3d", "overdue"), absolute on hover, red when overdue
- **Avatar** — single user (multi-user-ready)
- **Kbd** — platform-aware modifier display (`⌘` on Mac, `Ctrl` on Win)
- **RowAction** — inline button revealed on row hover
- **EmptyState** — icon, headline, one-line body, primary CTA, keyboard hint
- **ListView** — virtualized via `@tanstack/react-virtual` when over 200 rows; supports grouping, multi-select, sorting, column show/hide
- **DetailHeader** — breadcrumb + inline-editable title + chip row
- **Combobox** — generic single/multi pickers for assign / label / status

---

## 13. State & data

- Server components fetch initial data directly via Drizzle from `lib/server/data/*` (which is `userId`-scoped per §7.3).
- Use `getQueryClient()` + `dehydrate(qc)` + `<HydrationBoundary>` for SSR cache handoff.
- Client mutations via React Query `useMutation`; on success, invalidate matching query keys.
- `staleTime: 30_000`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`.
- **Optimistic updates** for: status toggle, priority change, mark-done, quick-capture. Roll back on error and toast.
- Query keys follow `['items', { kind, projectId, status, ... }]` shape — never stringified.

---

## 14. Notes editor (TipTap)

Extensions:
- StarterKit
- TaskList + TaskItem
- Placeholder
- Link (autolink, openOnClick)
- Mention (suggestion source = items in current workspace)

Behavior:
- Slash menu: H1, H2, H3, bulleted list, numbered list, task list, quote, code block, divider
- Auto-save on blur and every 3 seconds; show "Saved · 12s ago" indicator
- Store as ProseMirror JSON in `notes.content` (`jsonb not null default '{}'::jsonb`).
- Editor scope shortcuts isolated (don't bubble to global keymap).

### 14.1 Bundle hygiene (mandatory)

TipTap + ProseMirror is ~80kb gzipped. It must NEVER ship in the initial route bundle for any page that doesn't open an editor.

- The editor lives in `components/features/notes/Editor.tsx`.
- Every consumer imports it via `next/dynamic` with `ssr: false`:

  ```tsx
  import dynamic from 'next/dynamic';

  const Editor = dynamic(
    () => import('@/components/features/notes/Editor').then(m => m.Editor),
    {
      ssr: false,
      loading: () => <EditorSkeleton />,
    }
  );
  ```

- `EditorSkeleton` is a static div sized to the editor's expected dimensions, preventing CLS.
- The mention-extension suggestion list is a separate dynamic import inside `Editor.tsx`, fetched only when the user types `@`.
- **List views never import the editor** — they render the first 120 chars of the note as plain text using a `proseMirrorToPlainText(json)` helper (synchronous, ~1kb).
- Verify after build: `npm run build` then check that `/notes` route's first-load JS is < 200kb and the dashboard / issues / projects / events routes don't reference any `tiptap` chunk in the route manifest.

---

## 15. Time tracking

- One active timer per user, enforced at the DB level by the partial unique index in §7.2.7.
- Starting a new timer auto-stops any existing active timer for that user (server-side, in a transaction).
- Floating timer chip in topbar when a timer is active: shows `mm:ss`, click to stop or jump to logged item.
- Pomodoro preferences in Settings; default interval 25/5.

---

## 16. Recurrence

Date math, DST, and month-end clamping are the highest-risk piece of the rebuild. Write the algorithm fresh, then prove it with tests before wiring it to anything.

### 16.1 Algorithm

`materializeRecurrencesForUser(userId, now = new Date())` runs from the cron handler. For each table in `{ tasks, assignments, events, bills }` that has a non-null `recurrence_rule_id`:

1. Load the parent row and its rule.
2. Compute the next 14 days of occurrence dates from `now`, given `(frequency, interval, days_of_week, end_date, count)`.
3. For each occurrence that doesn't yet have a materialized child row (matched on `recurrence_rule_id` + the occurrence's anchor date), insert one. Inherit the parent's user_id, title, status defaults, etc.
4. Idempotent: re-running in the same window produces zero new rows.

Date math rules:
- All comparisons in the user's timezone (default UTC for now — `events.timezone` is a future field, not in scope).
- Monthly anchor on day N: if month doesn't have day N, clamp to last day of month (Jan 31 → Feb 28/29 → Mar 31).
- Weekly with `days_of_week`: emit one occurrence per matching day each week.
- `end_date` is inclusive: an occurrence falling exactly on `end_date` is generated.
- `count` is a hard cap on lifetime occurrences across all materializations.

### 16.2 Required tests

Create `lib/server/recurrence.test.ts`. Run with `node --test --import tsx lib/server/recurrence.test.ts`. No test framework dependency — use the `node:test` standard library and `node:assert`.

These cases MUST pass before the cron handler is considered done:

- weekly rule spanning a US DST-forward transition (e.g. anchor 2025-03-09)
- weekly rule spanning a US DST-backward transition (e.g. anchor 2025-11-02)
- monthly rule anchored on day 31 — Feb clamps to 28; leap-year Feb clamps to 29
- monthly rule with `end_date` falling mid-month — generated dates respect it inclusively
- count-limited rule (`count = 5`) — stops after 5, even when the 14-day window contains more
- weekly rule with `days_of_week = [1, 3, 5]` — only Mon/Wed/Fri are emitted
- leap year (2024): Feb 29 anchor renders correctly; non-leap years clamp
- idempotency: running the function twice with the same `now` produces zero new rows the second time
- empty rule: no `end_date`, no `count`, weekly — caps generation at the 14-day window

Add a `npm test` script that runs these.

### 16.3 UI

- When an item has a recurrence rule, render a `↻ weekly` chip beside the title in the detail panel and in non-dense list rows.
- Click the chip → small popover with rule fields (frequency, interval, days-of-week chips, end-date, count).
- Do NOT show the chip in dense list views — only in detail panel and expanded rows.

---

## 17. Dashboard

Single-column layout, top-to-bottom:
1. Greeting line + today's date in small muted text
2. Horizontal scroll of **Today cards** (clickable, open detail panel):
   - Overdue (count)
   - Due today (count)
   - Active timer (if any)
   - Bills due this week (count + sum)
   - Events today (count)
3. **This week** grid (2x2 on desktop, 1-col on mobile):
   - Grade summary (per course, points-earned/points-possible bar)
   - Money this month (in vs out, mini bar chart)
   - Project progress (top 3 active, percentage done)
   - Upcoming events (next 5, with date chip)

No animations beyond the standard page-mount fade.

---

## 18. Settings

Single page, tabs (Radix Tabs):
- **Profile** — display name, email (read-only)
- **Appearance** — theme (system / light / dark), sidebar default width, dense vs comfortable spacing
- **Shortcuts** — read-only list grouped by scope (the keymap registry data structure must allow per-user overrides, but the UI to edit them is out of scope for v2)
- **Workspaces** — CRUD list
- **Pay schedule** — frequency + reference date
- **Notifications** — placeholder UI (no backend yet)
- **Data** — export button (hits `/api/export`, which streams a JSON dump of every row owned by the user)
- **Danger zone** — sign out (calls `/api/auth/logout`)

---

## 19. Mobile

Below 768px:
- Sidebar → `vaul` drawer, opened by hamburger in topbar
- Detail panel → `vaul` full-screen sheet
- List rows stay 36px but text shrinks to 12px
- Command palette opens full-screen
- Touch targets ≥ 44px on actionable rows (achieved by row padding, not height)

---

## 20. Deployment

- Vercel hosting.
- `vercel.json`:
  - Cron: `0 4 * * *` → `/api/cron/auto-complete`
  - Security headers: HSTS 63072000 (2y) + includeSubDomains + preload; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Env vars (`.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL` (Supabase pooler, port 6543, serverless mode)
  - `CRON_SECRET`
  - `SEED_USER_ID` (optional, only for scripts/seed.ts)

### Supabase project settings
- **Auth → Providers → Email**: enabled
- **Auth → Sign Ups → Allow new users to sign up**: **OFF** (the app has no signup UI; this disables the API path as well)
- **Auth → Email Templates**: not used by the app; safe to leave defaults
- **RLS**: enable on every table; add policies mirroring application checks (`auth.uid() = user_id`)
- **Account provisioning**: create users via Auth → Users → Add user → "Create new user" with a temporary password. Communicate the password out-of-band; the user can change it from the Supabase Dashboard (not from inside the app).

---

## 21. Definition of done

- Every feature listed in §6 reachable and usable.
- All §16.2 recurrence tests pass.
- All §3.1 pre-flight checks pass.
- 100% keyboard-navigable from login to any item.
- `Cmd+K` opens in < 50ms; result list streams as you type.
- Dark + light parity. Every screen looks intentional in both modes.
- Responsive: works at 360px width.
- Lighthouse on Dashboard and Issues: Perf ≥ 90, A11y ≥ 95.
- `tsc --noEmit` clean.
- `eslint` clean (zero warnings on changed files).
- No dead code, no commented-out blocks, no TODOs left in shipped files.

---

## 22. Out of scope (do not build)

- Public signup, password reset, magic-link, or any self-service auth (accounts are created in the Supabase Dashboard)
- Collaboration / sharing between users (each user's data is fully isolated)
- Teams, organizations, or workspace invitations
- OAuth / SSO
- Real-time presence or comments
- Mobile native app
- Letterboxd or any external integration
- Email or push notifications
- AI features
- Themes beyond light/dark
- Admin / moderation tooling

---

## 23. Build order

1. **Init**: from inside `C:\Repos\PlannerV2`, run `create-next-app .` (in place — see §24); install deps with the exact pins from §24; run §3.1 pre-flight checks. Confirm `BUILD_PROMPT.md`, `AGENTS.md`, and `public/` survived scaffolding.
2. **Schema**: design `lib/db/schema.ts` fresh against §A1 and the §7.2 invariants. Generate the initial migration with `drizzle-kit generate`. Hand-review the SQL for every invariant in §7.2. Apply via Supabase Dashboard → SQL Editor.
3. **RLS + auth scaffolding**: enable RLS on every table; add the §7.3.5 policies. Write `proxy.ts`, `lib/auth/require-auth.ts`, `lib/auth/ownership.ts`, `lib/server/auth.ts`, and the three Supabase clients (`server.ts`, `browser.ts`, `middleware.ts`). Build the styled `/login` page per §5. Disable signups in the Supabase Dashboard. Wire `bootstrapNewUser`. Create the test user (`dexter.niles5@gmail.com`, see §1.1) in the Dashboard and verify sign-in → empty dashboard renders with the three default workspaces.
4. **Recurrence engine**: write `lib/server/recurrence.ts` and `lib/server/recurrence.test.ts`. All §16.2 tests must pass before any feature page is built — this is the engine the cron will call later.
5. **AppShell**: Sidebar, Topbar, DetailPanel slot (empty), theme, design tokens, layout primitives. All pages render an `EmptyState`.
6. **Keymap + CommandPalette**: keymap registry, mount global shortcuts, Cmd+K with navigation mode only, `Cmd+/` shortcut help.
7. **Issues view** (the reference implementation):
   - `GET /api/items` endpoint
   - ListView with grouping by status, virtualization, multi-select
   - DetailPanel with full edit surface
   - All list-scope and detail-scope shortcuts
   - Optimistic status / priority / done toggles
8. **Replicate the pattern** for: Projects, Courses (incl. syllabus upload), Events, Money, Notes (with TipTap), Calendar.
9. **Dashboard**.
10. **Settings + export**.
11. **Cron handler** — wires the §16 engine to `/api/cron/auto-complete`; also runs the auto-complete logic for past courses and events.
12. **Mobile pass** — `vaul` drawers, sheet detail panels, narrow-viewport polish.
13. **Lighthouse + a11y + final polish**.

---

## 24. First commands

```bash
# Run from inside C:\Repos\PlannerV2. The directory already contains:
#   BUILD_PROMPT.md  (this spec — read it first if you haven't already)
#   AGENTS.md        (short pointer to this spec)
#   public/          (owner will drop logo.svg etc. here)
#
# Scaffold Next.js IN PLACE — the "." target tells create-next-app to use the
# current directory instead of creating a new one. When prompted
# "Directory is not empty, continue?" answer YES — your existing files are kept.

npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Verify the three pre-existing files survived
ls BUILD_PROMPT.md AGENTS.md public/   # all three should still be present

# create-next-app writes package.json with name "plannerv2" (lowercased).
# Rename it to "planner-v2" by hand to match npm convention.

npx shadcn@latest init
# Style: new-york
# Base color: neutral
# CSS variables: yes

npm i @supabase/ssr @supabase/supabase-js \
      drizzle-orm@0.45.2 \
      @tanstack/react-query @tanstack/react-virtual \
      react-hook-form @hookform/resolvers zod \
      cmdk motion@~11.15.0 \
      @dnd-kit/core @dnd-kit/sortable \
      react-resizable-panels vaul \
      @tiptap/react @tiptap/starter-kit \
      @tiptap/extension-task-list @tiptap/extension-task-item \
      @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-mention \
      react-hotkeys-hook \
      date-fns chrono-node \
      sonner next-themes lucide-react \
      @vercel/analytics @vercel/speed-insights

npm i -D drizzle-kit@0.31.10 @types/node tsx

# Run the pre-flight checks (see §3.1)
npm run verify:deps
```

Then add shadcn components as needed:

```bash
npx shadcn@latest add button input label dialog popover dropdown-menu tabs tooltip command sheet separator avatar badge select textarea form switch sonner
```

---

## 25. House rules for the build agent

- Before writing any Next.js routing, caching, or middleware code, read the relevant doc in `node_modules/next/dist/docs/`.
- Default to server components. Mark `"use client"` only where required (hooks, browser APIs, event handlers).
- One zod schema per domain in `lib/validations/`; share between client form and server route.
- Write no comments except where the *why* is non-obvious. Never narrate what the code does.
- Don't add error handling for things that can't happen. Trust internal invariants.
- Don't introduce abstractions on first use. Three similar lines is better than a premature helper.
- Test UI changes in a real browser before claiming done. Type checks ≠ feature checks.
- Never run `db:migrate` locally. Output SQL for the user to paste into Supabase SQL Editor.
- Never reference v1 source files. If something is unclear, the answer is in §A1 or it's a design decision to make now.

---

## §A1 Appendix — logical reference

This is the only thing carried forward from the prior planner. It's a logical model, not source code. Design every file in v2 against it.

### A1.1 Tables (20 total)

Names below use `snake_case` for DB; Drizzle aliases use `camelCase`. All tables also have `id`, `created_at`, `updated_at` per §7.2 — omitted below for brevity.

| Table | Columns | Notes |
|---|---|---|
| `workspaces` | `user_id`, `name`, `type` (enum), `color`, `icon`, `sort_order` (int) | User-owned containers |
| `courses` | `workspace_id`, `user_id`, `name`, `code`, `instructor`, `semester`, `credits` (numeric), `meeting_schedule` (jsonb), `syllabus_file_path`, `syllabus_name`, `syllabus_uploaded_at` (timestamptz), `color`, `status` (enum), `start_date` (date), `end_date` (date) | |
| `grade_categories` | `course_id`, `name`, `weight` (numeric 5,2), `drop_lowest_n` (int default 0) | Child of course; cascade delete |
| `assignments` | `course_id`, `user_id`, `title`, `description`, `due_date` (timestamptz), `category_id` (fk grade_categories, nullable, set null), `status` (enum), `points_earned` (numeric 6,2 null), `points_possible` (numeric 6,2 null), `notes`, `recurrence_rule_id` | |
| `projects` | `workspace_id`, `user_id`, `name`, `description`, `goal`, `status` (enum), `priority` (enum), `start_date` (date), `target_date` (date), `color` | |
| `tasks` | `project_id`, `user_id`, `title`, `description`, `due_date` (timestamptz), `status` (enum), `priority` (enum), `parent_task_id` (self fk, nullable, cascade), `notes`, `recurrence_rule_id` | Self-referential for subtasks |
| `milestones` | `project_id`, `title`, `description`, `target_date` (date), `completed_at` (timestamptz null) | Child of project; cascade |
| `event_categories` | `user_id`, `name`, `color`, `sort_order` (int) | Unique (user_id, name) |
| `events` | `user_id`, `title`, `description`, `category_id` (fk, nullable, set null), `starts_at` (timestamptz), `ends_at` (timestamptz), `all_day` (bool), `location`, `url`, `attendees` (text), `status` (enum), `color`, `recurrence_rule_id` | |
| `bill_categories` | `user_id`, `name`, `color`, `sort_order` (int) | Unique (user_id, name) |
| `bills` | `user_id`, `name`, `description`, `amount` (numeric 12,2), `category_id` (fk, nullable, set null), `due_date` (date), `status` (enum), `paid_at` (timestamptz null), `paid_amount` (numeric 12,2 null), `notes`, `color`, `recurrence_rule_id` | |
| `pay_schedule` | `user_id`, `frequency` (enum), `reference_date` (date) | Unique on user_id |
| `recurrence_rules` | `frequency` (enum), `interval` (int default 1), `days_of_week` (int[] null), `end_date` (date null), `count` (int null) | Shared by assignments, tasks, events, bills |
| `notes` | `user_id`, `parent_type` (enum), `parent_id` (uuid), `title`, `content` (jsonb), `session_date` (date null) | Polymorphic; ProseMirror JSON |
| `resources` | `user_id`, `parent_type` (enum), `parent_id` (uuid), `type` (enum), `title`, `url`, `file_path`, `metadata` (jsonb) | Polymorphic |
| `tags` | `user_id`, `name`, `color` | Unique (user_id, name) |
| `taggings` | `tag_id`, `taggable_type` (enum), `taggable_id` (uuid) | Polymorphic join |
| `time_logs` | `user_id`, `loggable_type` (enum), `loggable_id` (uuid), `started_at` (timestamptz), `ended_at` (timestamptz null), `duration_seconds` (int null), `was_pomodoro` (bool), `pomodoro_interval_minutes` (int null), `notes` | Partial unique index on `(user_id) WHERE ended_at IS NULL` |
| `income_entries` | `user_id`, `kind` (enum), `received_date` (date), `amount` (numeric 12,2), `source`, `notes` | |
| `inbox_items` | `user_id`, `content`, `captured_at` (timestamptz), `triage_at` (timestamptz null), `resulting_item_type` (text null), `resulting_item_id` (uuid null) | Preserved in schema; not surfaced in v2 UI |

### A1.2 Enums

| Enum | Values |
|---|---|
| `workspace_type` | `academic`, `projects`, `custom` |
| `course_status` | `planned`, `active`, `completed`, `dropped` |
| `assignment_status` | `not_started`, `in_progress`, `submitted`, `graded` |
| `project_status` | `planning`, `active`, `paused`, `done` |
| `priority` | `low`, `medium`, `high`, `urgent` |
| `task_status` | `not_started`, `in_progress`, `done`, `cancelled` |
| `note_parent_type` | `course`, `project`, `assignment`, `task`, `session`, `daily_log`, `standalone`, `event` |
| `resource_parent_type` | `course`, `project`, `assignment`, `task` |
| `resource_type` | `link`, `file`, `book_reference` |
| `bill_status` | `unpaid`, `paid`, `skipped` |
| `pay_frequency` | `weekly`, `biweekly`, `monthly` |
| `event_status` | `confirmed`, `tentative`, `cancelled`, `completed` |
| `recurrence_frequency` | `daily`, `weekly`, `biweekly`, `monthly`, `custom` |
| `time_log_parent_type` | `course`, `project`, `assignment`, `task` |
| `income_kind` | `paycheck`, `misc` |
| `taggable_type` | `course`, `project`, `assignment`, `task`, `event`, `bill`, `note` |

### A1.3 Storage

Supabase Storage bucket `syllabi`:
- Max file size: 10 MB
- Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/markdown`
- Access: owner-only via RLS policy (`auth.uid()` matches the `user_id` in `storage.objects.metadata`)

### A1.4 Route inventory

API routes to implement, grouped by domain. All require auth except where noted. CRUD = `GET /list`, `POST /create`, `GET /[id]`, `PATCH /[id]`, `DELETE /[id]`.

| Domain | Routes |
|---|---|
| Workspaces | CRUD |
| Courses | CRUD + `GET /[id]/syllabus` (signed URL) |
| Grade categories | CRUD |
| Assignments | CRUD + `POST /bulk` |
| Projects | CRUD |
| Tasks | CRUD + `POST /[id]/bulk` |
| Milestones | CRUD + `POST /bulk` + `GET /upcoming` |
| Events | CRUD + `GET /upcoming` + `GET /by-date?date=…` |
| Event categories | CRUD |
| Bills | CRUD + `POST /bulk-mark-paid` + `GET /upcoming` |
| Bill categories | CRUD |
| Income | CRUD |
| Pay schedule | `GET` + `PUT` (single row per user) |
| Recurrence rules | CRUD |
| Notes | CRUD |
| Resources | CRUD |
| Tags | CRUD |
| Taggings | `POST` (attach) + `DELETE` (detach) |
| Time logs | CRUD + `POST /[id]/stop` + `GET /active` |
| Items (new) | `GET /api/items?...` (unified issues query) |
| Calendar | `GET /calendar-items` (aggregates events, tasks, assignments, bills due) |
| Dashboard | `GET /dashboard/stats` + `GET /dashboard/grades` |
| Search | `GET /search?q=…` |
| Export | `GET /export` (streams full JSON dump) |
| Health | `GET /health` (public) |
| Auth | `POST /auth/logout` (public — clears session, redirects) |
| Cron | `POST /cron/auto-complete` (Bearer auth via `CRON_SECRET`; not user-bound) |

### A1.5 Cron behavior

`/api/cron/auto-complete`, daily 04:00 UTC:
1. For every user, run `materializeRecurrencesForUser(userId)` (§16).
2. For every user, mark `courses` with `end_date < today` and `status IN ('active', 'planned')` as `completed`.
3. For every user, mark `events` with `ends_at < now()` and `status = 'confirmed'` as `completed`.
4. Idempotent: re-running in the same window is a no-op.
