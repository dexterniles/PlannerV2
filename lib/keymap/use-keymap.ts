"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef } from "react";

import type { KeymapContext } from "@/lib/keymap/registry";
import { GLOBAL_SHORTCUTS } from "@/lib/keymap/registry";

type KeymapActions = Omit<KeymapContext, "router">;

export const KeymapActionsContext = createContext<KeymapActions | null>(null);

export function useKeymapActions(): KeymapActions {
  const ctx = useContext(KeymapActionsContext);
  if (!ctx) {
    throw new Error("useKeymapActions must be used within <KeymapProvider>");
  }
  return ctx;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

const SEQUENCE_TIMEOUT_MS = 800;

export function useGlobalKeymap() {
  const router = useRouter();
  const actions = useKeymapActions();
  const seqRef = useRef<{ key: string; at: number } | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const editable = isEditableTarget(e.target);

      // Combos and Escape work even from inputs.
      for (const s of GLOBAL_SHORTCUTS) {
        if (!s.keys.includes("+") && s.keys !== "escape") continue;
        if (s.keys === "escape" && e.key === "Escape") {
          s.handler({ router, ...actions });
          return;
        }
        if (s.keys === "mod+k" && mod && e.key.toLowerCase() === "k") {
          e.preventDefault();
          s.handler({ router, ...actions });
          return;
        }
        if (s.keys === "mod+/" && mod && e.key === "/") {
          e.preventDefault();
          s.handler({ router, ...actions });
          return;
        }
      }

      if (editable || mod || e.altKey) return;

      const now = Date.now();
      const prev = seqRef.current;
      seqRef.current = null;

      // Two-key sequence: `g` then <x>.
      if (prev && now - prev.at < SEQUENCE_TIMEOUT_MS) {
        const combo = `${prev.key}>${e.key.toLowerCase()}`;
        const seq = GLOBAL_SHORTCUTS.find((s) => s.keys === combo);
        if (seq) {
          e.preventDefault();
          seq.handler({ router, ...actions });
          return;
        }
      }

      if (e.key.toLowerCase() === "g") {
        seqRef.current = { key: "g", at: now };
        return;
      }

      const single = GLOBAL_SHORTCUTS.find(
        (s) => s.keys === e.key.toLowerCase(),
      );
      if (single) {
        e.preventDefault();
        single.handler({ router, ...actions });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, actions]);
}
