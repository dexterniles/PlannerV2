import { errorResponse, successResponse, toErrorResponse } from "@/lib/server/api-response";
import { runAutoComplete, timingSafeEqual } from "@/lib/server/cron";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token.length > 0 && timingSafeEqual(token, secret);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return errorResponse("unauthorized", "Invalid cron secret");
  }
  try {
    return successResponse(await runAutoComplete());
  } catch (error) {
    return toErrorResponse(error);
  }
}

export const GET = POST;
