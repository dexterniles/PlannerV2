import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { NotesView } from "@/components/features/notes/NotesView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { listNotes } from "@/lib/server/data/notes";

export const metadata = { title: "Notes" };

export default async function NotesPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["collection", "notes", ""],
    queryFn: () => listNotes(auth.userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesView />
    </HydrationBoundary>
  );
}
