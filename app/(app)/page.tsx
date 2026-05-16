import { Dashboard } from "@/components/features/dashboard/Dashboard";
import { getServerAuth } from "@/lib/server/auth";
import {
  getDueHeatmap,
  getOverdueItems,
  getTodayAgenda,
} from "@/lib/server/data/agenda";
import {
  getDashboardGrades,
  getDashboardStats,
} from "@/lib/server/data/dashboard";

export default async function DashboardPage() {
  const auth = await getServerAuth();
  const [stats, grades, agenda, heatmap, overdue] = await Promise.all([
    getDashboardStats(auth.userId),
    getDashboardGrades(auth.userId),
    getTodayAgenda(auth.userId),
    getDueHeatmap(auth.userId, 21),
    getOverdueItems(auth.userId, 8),
  ]);

  return (
    <Dashboard
      email={auth.email}
      stats={stats}
      grades={grades}
      agenda={agenda}
      heatmap={heatmap}
      overdue={overdue}
    />
  );
}
