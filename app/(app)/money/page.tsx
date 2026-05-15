import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { MoneyView } from "@/components/features/money/MoneyView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { listBills } from "@/lib/server/data/bills";
import { listIncome } from "@/lib/server/data/income";

export const metadata = { title: "Money" };

export default async function MoneyPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["collection", "bills", ""],
      queryFn: () => listBills(auth.userId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["collection", "income", ""],
      queryFn: () => listIncome(auth.userId),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MoneyView />
    </HydrationBoundary>
  );
}
