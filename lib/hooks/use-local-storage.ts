"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorageBoolean(
  key: string,
): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => false,
  );

  const set = useCallback(
    (next: boolean) => {
      localStorage.setItem(key, next ? "1" : "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key],
  );

  return [value, set];
}
