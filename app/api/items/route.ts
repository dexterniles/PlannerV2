import { requireAuthGuard } from "@/lib/auth/require-auth";
import { errorResponse, successResponse } from "@/lib/server/api-response";
import { getItems } from "@/lib/server/data/items";
import { itemsQuerySchema } from "@/lib/validations/items";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = itemsQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid query parameters",
      parsed.error.flatten().fieldErrors,
    );
  }

  const data = await getItems(auth.userId, parsed.data);
  return successResponse(data);
}
