import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse } from "@/lib/server/api-response";
import { getActiveTimeLog } from "@/lib/server/data/time-logs";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  return successResponse(await getActiveTimeLog(auth.userId));
}
