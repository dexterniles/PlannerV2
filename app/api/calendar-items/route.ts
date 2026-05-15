import { requireAuthGuard } from "@/lib/auth/require-auth";
import { errorResponse, successResponse } from "@/lib/server/api-response";
import { getCalendarItems } from "@/lib/server/data/calendar";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const sp = new URL(request.url).searchParams;
  const now = new Date();
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = sp.get("to")
    ? new Date(sp.get("to")!)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return errorResponse("validation", "Invalid from/to date");
  }

  return successResponse(await getCalendarItems(auth.userId, from, to));
}
