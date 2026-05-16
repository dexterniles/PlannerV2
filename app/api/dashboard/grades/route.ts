import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse, toErrorResponse } from "@/lib/server/api-response";
import { getDashboardGrades } from "@/lib/server/data/dashboard";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  try {
    return successResponse(await getDashboardGrades(auth.userId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
