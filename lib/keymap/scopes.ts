export const KEYMAP_SCOPES = ["global", "list", "detail", "editor"] as const;

export type KeymapScope = (typeof KEYMAP_SCOPES)[number];
