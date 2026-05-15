import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import { getPaySchedule, putPaySchedule } from "@/lib/server/data/pay-schedule";
import { putPayScheduleSchema } from "@/lib/validations/money";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  return successResponse(await getPaySchedule(auth.userId));
}

export async function PUT(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = putPayScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid pay schedule",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  try {
    return successResponse(await putPaySchedule(auth.userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
