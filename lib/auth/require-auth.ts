import { errorResponse } from "@/lib/server/api-response";

export type AuthIdentity = { ok: true; userId: string; email: string };
export type AuthFailure = { ok: false; response: Response };

export async function requireAuthGuard(
  request: Request,
): Promise<AuthIdentity | AuthFailure> {
  const userId = request.headers.get("x-auth-user-id");
  const email = request.headers.get("x-auth-user-email") ?? "";
  if (!userId) {
    return {
      ok: false,
      response: errorResponse("unauthorized", "Authentication required"),
    };
  }
  return { ok: true, userId, email };
}
