"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRIMARY_NAV, WORKSPACE_NAV, type NavItem } from "@/lib/nav/sidebar-nav";
import { cn } from "@/lib/utils";

type WorkspaceSummary = { id: string; name: string; type: string };

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-7 items-center gap-2 rounded-md px-2 text-sm text-text-muted transition-colors hover:bg-bg-hover hover:text-text",
        active && "bg-bg-hover text-text",
        collapsed && "justify-center px-0",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-brand" />
      ) : null}
      <Icon className="size-4 shrink-0" />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  collapsed,
  workspaces,
  email,
}: {
  collapsed: boolean;
  workspaces: WorkspaceSummary[];
  email: string;
}) {
  const pathname = usePathname();
  const initials = email.slice(0, 2).toUpperCase() || "PL";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border-subtle bg-bg",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-11 items-center gap-2 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Image
          src="/logo.png"
          alt="Planner"
          width={24}
          height={24}
          priority
          className="size-6 shrink-0"
        />
        {collapsed ? null : (
          <span className="text-sm font-semibold tracking-tight">Planner</span>
        )}
      </div>

      {collapsed ? null : (
        <div className="px-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-border-subtle px-2 text-sm text-text-muted hover:bg-bg-hover">
              <span className="truncate">
                {workspaces[0]?.name ?? "Workspace"}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {workspaces.map((w) => (
                <DropdownMenuItem key={w.id}>{w.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2">
        {PRIMARY_NAV.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(pathname, item.href)}
          />
        ))}
        <div className="my-2 h-px bg-border-subtle" />
        {WORKSPACE_NAV.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      <div
        className={cn(
          "flex h-12 items-center gap-2 border-t border-border-subtle px-3",
          collapsed && "flex-col justify-center gap-1 px-0 py-1",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md outline-none">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="truncate font-normal text-text-muted">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild variant="destructive">
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {collapsed ? null : <span className="flex-1" />}
        <ThemeToggle />
      </div>
    </aside>
  );
}
