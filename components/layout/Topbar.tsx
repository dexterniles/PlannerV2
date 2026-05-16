"use client";

import { PanelLeft, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { TimerChip } from "@/components/layout/TimerChip";
import { Kbd } from "@/components/shared/Kbd";
import { Button } from "@/components/ui/button";
import { useKeymapActions } from "@/lib/keymap/use-keymap";
import { PRIMARY_NAV, WORKSPACE_NAV } from "@/lib/nav/sidebar-nav";

const ALL_NAV = [...PRIMARY_NAV, ...WORKSPACE_NAV];

function crumbLabel(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const match = ALL_NAV.find(
    (n) => n.href !== "/" && pathname.startsWith(n.href),
  );
  if (match) return match.label;
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const { openCommandPalette } = useKeymapActions();

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        <PanelLeft className="size-4" />
      </Button>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-text">
          {crumbLabel(pathname)}
        </span>
      </nav>
      <div className="flex-1" />
      <TimerChip />
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex h-7 items-center gap-2 rounded-md border border-border-subtle px-2 text-xs text-text-muted transition-colors hover:bg-bg-hover"
      >
        <Search className="size-3.5" />
        <span>Search</span>
        <Kbd keys="mod+k" />
      </button>
    </header>
  );
}
