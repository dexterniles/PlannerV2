import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CalendarView } from "@/components/features/calendar/CalendarView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { getCalendarItems } from "@/lib/server/data/calendar";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await queryClient.prefetchQuery({
    queryKey: ["collection", "calendar-items", ""],
    queryFn: () => getCalendarItems(auth.userId, from, to),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarView />
    </HydrationBoundary>
  );
}
