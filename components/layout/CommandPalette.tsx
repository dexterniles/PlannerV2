"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search as SearchIcon, Settings } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CREATE_KINDS, CREATE_LABEL } from "@/lib/create/kinds";
import { useKeymapActions } from "@/lib/keymap/use-keymap";
import { PRIMARY_NAV, WORKSPACE_NAV } from "@/lib/nav/sidebar-nav";

const NAV_GROUPS = [
  { heading: "Navigation", items: PRIMARY_NAV },
  { heading: "Workspace", items: WORKSPACE_NAV },
  {
    heading: "Other",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

const SEARCH_ROUTE: Record<string, string> = {
  task: "/issues",
  assignment: "/issues",
  project: "/projects",
  course: "/courses",
  event: "/events",
  note: "/notes",
  bill: "/money",
};

type SearchResult = {
  kind: keyof typeof SEARCH_ROUTE;
  id: string;
  title: string;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { openCreate } = useKeymapActions();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const mode = value.startsWith(">")
    ? "action"
    : value.startsWith("?")
      ? "search"
      : "nav";
  const searchTerm = mode === "search" ? value.slice(1).trim() : "";
  const actionTerm =
    mode === "action" ? value.slice(1).trim().toLowerCase() : "";
  const navTerm = mode === "nav" ? value.trim().toLowerCase() : "";

  const matchNav = (label: string) =>
    !navTerm || label.toLowerCase().includes(navTerm);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (mode !== "search" || searchTerm.length < 1) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data: SearchResult[] };
        setResults(json.data);
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [mode, searchTerm]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setValue("");
        setResults([]);
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const go = useCallback(
    (href: string) => {
      handleOpenChange(false);
      router.push(href);
    },
    [router, handleOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        value={value}
        onValueChange={setValue}
        placeholder="Type to navigate · > to create · ? to search"
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {mode === "action" ? (
          <CommandGroup heading="Create">
            {CREATE_KINDS.filter(
              (k) =>
                !actionTerm ||
                CREATE_LABEL[k].toLowerCase().includes(actionTerm),
            ).map((k) => (
              <CommandItem
                key={k}
                value={`new ${CREATE_LABEL[k]}`}
                onSelect={() => {
                  handleOpenChange(false);
                  openCreate(k);
                }}
              >
                <Plus className="text-text-subtle" />
                New {CREATE_LABEL[k].toLowerCase()}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {mode === "search" ? (
          <CommandGroup heading="Search results">
            {results.map((r) => (
              <CommandItem
                key={`${r.kind}:${r.id}`}
                value={`${r.title} ${r.kind} ${r.id}`}
                onSelect={() =>
                  go(
                    r.kind === "bill"
                      ? "/money"
                      : `${SEARCH_ROUTE[r.kind]}?detail=${r.kind}:${r.id}`,
                  )
                }
              >
                <SearchIcon className="text-text-subtle" />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-xs text-text-subtle">{r.kind}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {mode === "nav"
          ? NAV_GROUPS.map((group) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.items
                  .filter((item) => matchNav(item.label))
                  .map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      onSelect={() => go(item.href)}
                    >
                      <Icon className="text-text-subtle" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))
          : null}
      </CommandList>
    </CommandDialog>
  );
}
