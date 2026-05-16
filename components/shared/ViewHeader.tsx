"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CreateKind } from "@/lib/create/kinds";
import { useKeymapActions } from "@/lib/keymap/use-keymap";

export function ViewHeader({
  title,
  createKind,
}: {
  title: string;
  createKind: CreateKind;
}) {
  const { openCreate } = useKeymapActions();
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-4">
      <span className="text-sm font-medium text-text">{title}</span>
      <Button size="xs" onClick={() => openCreate(createKind)}>
        <Plus className="size-3" />
        New
      </Button>
    </div>
  );
}
