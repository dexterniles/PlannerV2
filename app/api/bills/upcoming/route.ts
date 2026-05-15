import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse } from "@/lib/server/api-response";
import { listUpcomingBills } from "@/lib/server/data/bills";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const days = Number(new URL(request.url).searchParams.get("days")) || 7;
  return successResponse(await listUpcomingBills(auth.userId, days));
}
