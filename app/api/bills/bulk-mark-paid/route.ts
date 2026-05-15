import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import { bulkMarkPaid } from "@/lib/server/data/bills";
import { bulkMarkPaidSchema } from "@/lib/validations/money";

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = bulkMarkPaidSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid request",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  try {
    return successResponse(await bulkMarkPaid(auth.userId, parsed.data.ids));
  } catch (error) {
    return toErrorResponse(error);
  }
}
