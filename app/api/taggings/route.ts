import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import { attachTagging, detachTagging } from "@/lib/server/data/taggings";
import { attachTaggingSchema } from "@/lib/validations/supporting";

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = attachTaggingSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid tagging",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  try {
    return successResponse(await attachTagging(auth.userId, parsed.data), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = attachTaggingSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid tagging",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  try {
    return successResponse(await detachTagging(auth.userId, parsed.data));
  } catch (error) {
    return toErrorResponse(error);
  }
}
