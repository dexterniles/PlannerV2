import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { CreateKind } from "@/lib/create/kinds";
import type { KeymapScope } from "@/lib/keymap/scopes";

export type KeymapContext = {
  router: AppRouterInstance;
  openCommandPalette: () => void;
  openShortcutHelp: () => void;
  toggleTheme: () => void;
  closeDetail: () => void;
  openCreate: (kind?: CreateKind) => void;
};

export type Shortcut = {
  id: string;
  keys: string;
  description: string;
  scope: KeymapScope;
  group: string;
  handler: (ctx: KeymapContext) => void;
};

export const GLOBAL_SHORTCUTS: Shortcut[] = [
  {
    id: "command-palette",
    keys: "mod+k",
    description: "Open command palette",
    scope: "global",
    group: "General",
    handler: (c) => c.openCommandPalette(),
  },
  {
    id: "shortcut-help",
    keys: "mod+/",
    description: "Show keyboard shortcuts",
    scope: "global",
    group: "General",
    handler: (c) => c.openShortcutHelp(),
  },
  {
    id: "create",
    keys: "c",
    description: "Create (context-aware)",
    scope: "global",
    group: "General",
    handler: (c) => c.openCreate(),
  },
  {
    id: "toggle-theme",
    keys: "t",
    description: "Toggle theme",
    scope: "global",
    group: "General",
    handler: (c) => c.toggleTheme(),
  },
  {
    id: "close-detail",
    keys: "escape",
    description: "Close detail panel / clear selection",
    scope: "global",
    group: "General",
    handler: (c) => c.closeDetail(),
  },
  {
    id: "go-issues",
    keys: "g>i",
    description: "Go to Issues",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/issues"),
  },
  {
    id: "go-projects",
    keys: "g>p",
    description: "Go to Projects",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/projects"),
  },
  {
    id: "go-courses",
    keys: "g>c",
    description: "Go to Courses",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/courses"),
  },
  {
    id: "go-events",
    keys: "g>e",
    description: "Go to Events",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/events"),
  },
  {
    id: "go-money",
    keys: "g>$",
    description: "Go to Money",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/money"),
  },
  {
    id: "go-notes",
    keys: "g>n",
    description: "Go to Notes",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/notes"),
  },
  {
    id: "go-calendar",
    keys: "g>k",
    description: "Go to Calendar",
    scope: "global",
    group: "Navigation",
    handler: (c) => c.router.push("/calendar"),
  },
];

export const ALL_SHORTCUTS: Shortcut[] = [...GLOBAL_SHORTCUTS];

export function shortcutsForScope(scope: KeymapScope): Shortcut[] {
  return ALL_SHORTCUTS.filter((s) => s.scope === scope);
}
