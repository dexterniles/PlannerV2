import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse, toErrorResponse } from "@/lib/server/api-response";
import { stopTimeLog } from "@/lib/server/data/time-logs";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  try {
    return successResponse(await stopTimeLog(auth.userId, id));
  } catch (error) {
    return toErrorResponse(error);
  }
}
