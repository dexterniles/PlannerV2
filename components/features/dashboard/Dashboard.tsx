import { format } from "date-fns";
import Link from "next/link";

import { OverdueStrip } from "@/components/features/dashboard/OverdueStrip";
import { formatAbsolute } from "@/lib/utils/dates";
import type {
  AgendaItem,
  HeatmapCell,
  OverdueItem,
} from "@/lib/server/data/agenda";

type Stats = Awaited<
  ReturnType<typeof import("@/lib/server/data/dashboard").getDashboardStats>
>;
type Grades = Awaited<
  ReturnType<typeof import("@/lib/server/data/dashboard").getDashboardGrades>
>;

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function Card({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-[150px] flex-col gap-1 rounded-lg border border-border-subtle bg-bg-elevated p-3 transition-colors hover:bg-bg-hover"
    >
      <span className="text-xs text-text-subtle">{title}</span>
      <span className="text-2xl font-semibold tabular-nums text-text">
        {value}
      </span>
      {hint ? (
        <span className="text-xs text-text-muted">{hint}</span>
      ) : null}
    </Link>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-elevated p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-text-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
      <div
        className="h-full rounded-full bg-brand"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

const KIND_DOT: Record<AgendaItem["kind"], string> = {
  event: "var(--color-status-done)",
  task: "var(--color-accent)",
  assignment: "var(--color-status-in-progress)",
  bill: "var(--color-status-blocked)",
};

function TodayTimeline({ items }: { items: AgendaItem[] }) {
  return (
    <Panel title="Today">
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">Nothing scheduled today.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={`${it.kind}:${it.id}`}>
              <Link
                href={it.route}
                className="flex items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-bg-hover"
              >
                <span className="w-16 shrink-0 text-xs text-text-subtle tabular-nums">
                  {it.kind === "bill"
                    ? "due"
                    : format(new Date(it.at), "h:mm a")}
                </span>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: KIND_DOT[it.kind] }}
                />
                <span className="flex-1 truncate text-text">{it.title}</span>
                <span className="shrink-0 text-xs text-text-subtle capitalize">
                  {it.kind}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Heatmap({ cells }: { cells: HeatmapCell[] }) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  const shade = (count: number) => {
    if (count === 0) return "var(--color-bg-hover)";
    const t = 0.25 + 0.75 * (count / max);
    return `color-mix(in oklab, var(--color-brand) ${Math.round(t * 100)}%, transparent)`;
  };
  return (
    <Panel title="Workload · next 3 weeks">
      <Link href="/calendar" className="flex flex-wrap gap-1">
        {cells.map((c) => {
          const d = new Date(`${c.date}T00:00:00.000Z`);
          const weekend = [0, 6].includes(d.getUTCDay());
          return (
            <span
              key={c.date}
              title={`${format(d, "EEE MMM d")}: ${c.count} due`}
              className="flex h-7 w-7 items-center justify-center rounded text-xs tabular-nums"
              style={{
                backgroundColor: shade(c.count),
                color: weekend
                  ? "var(--color-text-subtle)"
                  : "var(--color-text-muted)",
              }}
            >
              {d.getUTCDate()}
            </span>
          );
        })}
      </Link>
    </Panel>
  );
}

export function Dashboard({
  email,
  stats,
  grades,
  agenda,
  heatmap,
  overdue,
}: {
  email: string;
  stats: Stats;
  grades: Grades;
  agenda: AgendaItem[];
  heatmap: HeatmapCell[];
  overdue: OverdueItem[];
}) {
  const hour = new Date().getUTCHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = email.split("@")[0];

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {greeting}, {name}
        </h1>
        <p className="text-xs text-text-muted">{formatAbsolute(new Date())}</p>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <Card
          title="Overdue"
          value={String(stats.overdue)}
          href="/issues"
        />
        <Card
          title="Due today"
          value={String(stats.dueToday)}
          href="/issues"
        />
        <Card
          title="Active timer"
          value={stats.activeTimer ? "Running" : "—"}
          hint={stats.activeTimer?.loggableType}
          href="/issues"
        />
        <Card
          title="Bills this week"
          value={String(stats.billsThisWeek.count)}
          hint={money(stats.billsThisWeek.sum)}
          href="/money"
        />
        <Card
          title="Events today"
          value={String(stats.eventsToday)}
          href="/events"
        />
      </div>

      {overdue.length > 0 ? <OverdueStrip initial={overdue} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TodayTimeline items={agenda} />
        <Heatmap cells={heatmap} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Grades">
          {grades.length === 0 ? (
            <p className="text-sm text-text-muted">No courses.</p>
          ) : (
            grades.map((g) => (
              <div key={g.courseId} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text">{g.courseName}</span>
                  <span className="text-text-muted tabular-nums">
                    {g.percent === null ? "—" : `${g.percent}%`}
                  </span>
                </div>
                <Bar percent={g.percent ?? 0} />
              </div>
            ))
          )}
        </Panel>

        <Panel title="Money this month">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">In</span>
            <span className="text-text tabular-nums">
              {money(stats.monthMoney.in)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Out</span>
            <span className="text-text tabular-nums">
              {money(stats.monthMoney.out)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-2 text-sm font-medium">
            <span className="text-text">Net</span>
            <span className="text-text tabular-nums">
              {money(stats.monthMoney.in - stats.monthMoney.out)}
            </span>
          </div>
        </Panel>

        <Panel title="Project progress">
          {stats.projectProgress.length === 0 ? (
            <p className="text-sm text-text-muted">No active projects.</p>
          ) : (
            stats.projectProgress.map((p) => (
              <div key={p.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text">{p.name}</span>
                  <span className="text-text-muted tabular-nums">
                    {p.percent}%
                  </span>
                </div>
                <Bar percent={p.percent} />
              </div>
            ))
          )}
        </Panel>

        <Panel title="Upcoming events">
          {stats.upcomingEvents.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing upcoming.</p>
          ) : (
            stats.upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex justify-between text-sm"
              >
                <span className="truncate text-text">{e.title}</span>
                <span className="shrink-0 text-xs text-text-subtle">
                  {formatAbsolute(e.startsAt)}
                </span>
              </div>
            ))
          )}
        </Panel>
      </div>
    </div>
  );
}
