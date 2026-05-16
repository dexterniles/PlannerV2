import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { IssuesView } from "@/components/features/issues/IssuesView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { getItems } from "@/lib/server/data/items";
import { itemsKey } from "@/lib/query/keys";

export const metadata = { title: "Issues" };

export default async function IssuesPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: itemsKey({}),
    queryFn: () => getItems(auth.userId, {}),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IssuesView />
    </HydrationBoundary>
  );
}
