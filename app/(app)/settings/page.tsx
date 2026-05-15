import { Settings } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      headline="Settings"
      body="Profile, appearance, workspaces, and data export."
    />
  );
}
