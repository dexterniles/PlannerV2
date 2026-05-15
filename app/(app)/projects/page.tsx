import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ProjectsView } from "@/components/features/projects/ProjectsView";
import { getQueryClient } from "@/lib/query/client";
import { getServerAuth } from "@/lib/server/auth";
import { listProjects } from "@/lib/server/data/projects";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const auth = await getServerAuth();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["collection", "projects", ""],
    queryFn: () => listProjects(auth.userId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsView />
    </HydrationBoundary>
  );
}
