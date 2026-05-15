import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { EventsView } from "@/components/features/events/EventsView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { listEvents } from "@/lib/server/data/events";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["collection", "events", ""],
    queryFn: () => listEvents(auth.userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventsView />
    </HydrationBoundary>
  );
}
