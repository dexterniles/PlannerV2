import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import {
  createAssignment,
  listAssignments,
} from "@/lib/server/data/assignments";
import { createAssignmentSchema } from "@/lib/validations/assignments";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const data = await listAssignments(auth.userId);
  return successResponse(data);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid assignment",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const data = await createAssignment(auth.userId, parsed.data);
    return successResponse(data, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
