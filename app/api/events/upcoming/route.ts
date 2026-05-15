import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse } from "@/lib/server/api-response";
import { listUpcomingEvents } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const limit = Number(new URL(request.url).searchParams.get("limit")) || 5;
  return successResponse(await listUpcomingEvents(auth.userId, limit));
}
