"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Kbd } from "@/components/shared/Kbd";
import { GLOBAL_SHORTCUTS, type Shortcut } from "@/lib/keymap/registry";

function groupByGroup(shortcuts: Shortcut[]) {
  const map = new Map<string, Shortcut[]>();
  for (const s of shortcuts) {
    const list = map.get(s.group) ?? [];
    list.push(s);
    map.set(s.group, list);
  }
  return [...map.entries()];
}

export function ShortcutHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const groups = groupByGroup(GLOBAL_SHORTCUTS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] gap-0">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
          <SheetDescription>Available in the current view.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          {groups.map(([group, items]) => (
            <div key={group} className="flex flex-col gap-1.5">
              <h3 className="text-text-subtle text-xs font-medium uppercase tracking-wide">
                {group}
              </h3>
              {items.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 py-1"
                >
                  <span className="text-text text-sm">{s.description}</span>
                  <Kbd keys={s.keys.replace(/>/g, " ")} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
