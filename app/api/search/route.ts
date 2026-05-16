import { requireAuthGuard } from "@/lib/auth/require-auth";
import { successResponse } from "@/lib/server/api-response";
import { search } from "@/lib/server/data/search";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return successResponse([]);
  return successResponse(await search(auth.userId, q));
}
