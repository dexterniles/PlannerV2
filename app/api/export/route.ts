import { requireAuthGuard } from "@/lib/auth/require-auth";
import { toErrorResponse } from "@/lib/server/api-response";
import { exportUserData } from "@/lib/server/data/export";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  try {
    const dump = await exportUserData(auth.userId);
    return new Response(JSON.stringify(dump, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="planner-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
