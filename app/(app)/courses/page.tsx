import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CoursesView } from "@/components/features/courses/CoursesView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { listCourses } from "@/lib/server/data/courses";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["collection", "courses", ""],
    queryFn: () => listCourses(auth.userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CoursesView />
    </HydrationBoundary>
  );
}
