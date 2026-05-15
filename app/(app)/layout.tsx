import { eq } from "drizzle-orm";
import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { KeymapProvider } from "@/components/layout/KeymapProvider";
import { Toaster } from "@/components/ui/sonner";
import { db } from "@/lib/db/client";
import { workspaces } from "@/lib/db/schema";
import { getServerAuth } from "@/lib/server/auth";
import { bootstrapNewUser } from "@/lib/server/data/bootstrap";

import { QueryProvider } from "./query-provider";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await getServerAuth();
  await bootstrapNewUser(auth.userId);

  const ws = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      type: workspaces.type,
    })
    .from(workspaces)
    .where(eq(workspaces.userId, auth.userId))
    .orderBy(workspaces.sortOrder);

  return (
    <QueryProvider>
      <Suspense fallback={null}>
        <KeymapProvider>
          <AppShell workspaces={ws} email={auth.email}>
            {children}
          </AppShell>
          <Toaster position="bottom-right" />
        </KeymapProvider>
      </Suspense>
    </QueryProvider>
  );
}
