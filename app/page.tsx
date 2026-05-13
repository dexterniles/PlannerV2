import { eq } from "drizzle-orm";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { db } from "@/lib/db/client";
import { workspaces } from "@/lib/db/schema";
import { getServerAuth } from "@/lib/server/auth";
import { bootstrapNewUser } from "@/lib/server/data/bootstrap";

export default async function DashboardPage() {
  const auth = await getServerAuth();
  await bootstrapNewUser(auth.userId);

  const ws = await db
    .select({ id: workspaces.id, name: workspaces.name, type: workspaces.type })
    .from(workspaces)
    .where(eq(workspaces.userId, auth.userId))
    .orderBy(workspaces.sortOrder);

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Planner</h1>
          <p className="text-xs text-muted-foreground">Signed in as {auth.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Workspaces</h2>
        <ul className="flex flex-col gap-1">
          {ws.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <span className="text-sm">{w.name}</span>
              <span className="text-xs text-muted-foreground">{w.type}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
