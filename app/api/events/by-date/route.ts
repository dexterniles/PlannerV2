import { requireAuthGuard } from "@/lib/auth/require-auth";
import { errorResponse, successResponse } from "@/lib/server/api-response";
import { listEventsByDate } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const raw = new URL(request.url).searchParams.get("date");
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return errorResponse("validation", "Valid `date` is required");
  }
  return successResponse(await listEventsByDate(auth.userId, date));
}
