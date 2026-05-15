"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const MAC_REPLACEMENTS: Record<string, string> = {
  mod: "⌘",
  cmd: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  enter: "↵",
  esc: "Esc",
  escape: "Esc",
};

const OTHER_REPLACEMENTS: Record<string, string> = {
  mod: "Ctrl",
  cmd: "Ctrl",
  meta: "Ctrl",
  ctrl: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  enter: "↵",
  esc: "Esc",
  escape: "Esc",
};

const noopSubscribe = () => () => {};

function useIsMac() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /mac|iphone|ipad|ipod/i.test(navigator.platform),
    () => false,
  );
}

export function Kbd({
  keys,
  className,
}: {
  keys: string;
  className?: string;
}) {
  const isMac = useIsMac();
  const map = isMac ? MAC_REPLACEMENTS : OTHER_REPLACEMENTS;
  const tokens = keys
    .trim()
    .split(/\s+/)
    .map((part) =>
      part
        .split("+")
        .map((k) => map[k.toLowerCase()] ?? k.toUpperCase())
        .join(isMac ? "" : "+"),
    );

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {tokens.map((t, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-subtle bg-bg-elevated px-1 font-mono text-xs text-text-muted"
        >
          {t}
        </kbd>
      ))}
    </span>
  );
}
