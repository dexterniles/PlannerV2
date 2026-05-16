"use client";

import { useCallback, useState, type ReactNode } from "react";

import { DensityProvider } from "@/components/layout/DensityContext";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocalStorageBoolean } from "@/lib/hooks/use-local-storage";
import { useIsMobile } from "@/lib/hooks/use-mobile";

const COLLAPSE_KEY = "planner.sidebar.collapsed";
const DENSITY_KEY = "planner.density.dense";

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
  const [dense] = useLocalStorageBoolean(DENSITY_KEY);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed(!collapsed);
  }, [isMobile, collapsed, setCollapsed]);

  return (
    <DensityProvider value={dense ? "dense" : "comfortable"}>
      <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
        {isMobile ? (
          <Drawer
            direction="left"
            open={mobileOpen}
            onOpenChange={setMobileOpen}
          >
            <DrawerContent className="w-72">
              <DrawerTitle className="sr-only">Navigation</DrawerTitle>
              <Sidebar
                collapsed={false}
                workspaces={workspaces}
                email={email}
                onNavigate={() => setMobileOpen(false)}
              />
            </DrawerContent>
          </Drawer>
        ) : (
          <Sidebar
            collapsed={collapsed}
            workspaces={workspaces}
            email={email}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onToggleSidebar={toggleSidebar} />
          <main className="flex flex-1 overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
            <DetailPanel mobile={isMobile} />
          </main>
        </div>
      </div>
    </DensityProvider>
  );
}
