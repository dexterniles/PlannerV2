"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { ShortcutHelp } from "@/components/layout/ShortcutHelp";
import { KeymapActionsContext, useGlobalKeymap } from "@/lib/keymap/use-keymap";

function GlobalKeymap() {
  useGlobalKeymap();
  return null;
}

export function KeymapProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();

  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const closeDetail = useCallback(() => {
    if (!searchParams.has("detail")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("detail");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, searchParams]);

  const actions = useMemo(
    () => ({
      openCommandPalette: () => setCommandOpen(true),
      openShortcutHelp: () => setHelpOpen(true),
      toggleTheme: () =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      closeDetail,
    }),
    [resolvedTheme, setTheme, closeDetail],
  );

  return (
    <KeymapActionsContext.Provider value={actions}>
      <GlobalKeymap />
      {children}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </KeymapActionsContext.Provider>
  );
}
