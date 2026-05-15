import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      headline="Dashboard"
      body="Your day at a glance. This view is built in a later phase."
    />
  );
}
