import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { workspaces } from "@/lib/db/schema";

export async function bootstrapNewUser(userId: string): Promise<void> {
  const existing = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);

  if (existing.length > 0) return;

  // The pre-check narrows the common case; onConflictDoNothing makes this
  // safe when concurrent first-load requests race past it (the dev double
  // GET, prefetch, or a fast double nav all trigger this).
  await db
    .insert(workspaces)
    .values([
      { userId, name: "Personal", type: "custom", sortOrder: 0 },
      { userId, name: "Academic", type: "academic", sortOrder: 1 },
      { userId, name: "Projects", type: "projects", sortOrder: 2 },
    ])
    .onConflictDoNothing();
}
