import { Dashboard } from "@/components/features/dashboard/Dashboard";
import { getServerAuth } from "@/lib/server/auth";
import {
  getDashboardGrades,
  getDashboardStats,
} from "@/lib/server/data/dashboard";

export default async function DashboardPage() {
  const auth = await getServerAuth();
  const [stats, grades] = await Promise.all([
    getDashboardStats(auth.userId),
    getDashboardGrades(auth.userId),
  ]);

  return <Dashboard email={auth.email} stats={stats} grades={grades} />;
}
