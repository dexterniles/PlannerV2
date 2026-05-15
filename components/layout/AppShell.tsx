"use client";

import { useCallback, useState, type ReactNode } from "react";

import { DetailPanel } from "@/components/layout/DetailPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLocalStorageBoolean } from "@/lib/hooks/use-local-storage";
import { useIsMobile } from "@/lib/hooks/use-mobile";

const COLLAPSE_KEY = "planner.sidebar.collapsed";

type WorkspaceSummary = { id: string; name: string; type: string };

export function AppShell({
  workspaces,
  email,
  children,
}: {
  workspaces: WorkspaceSummary[];
  email: string;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useLocalStorageBoolean(COLLAPSE_KEY);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed(!collapsed);
  }, [isMobile, collapsed, setCollapsed]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar
              collapsed={false}
              workspaces={workspaces}
              email={email}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar collapsed={collapsed} workspaces={workspaces} email={email} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="flex flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            {children}
          </div>
          {isMobile ? null : <DetailPanel />}
        </main>
      </div>
    </div>
  );
}
