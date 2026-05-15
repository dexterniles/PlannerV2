import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import {
  deleteAssignment,
  getAssignment,
  updateAssignment,
} from "@/lib/server/data/assignments";
import { updateAssignmentSchema } from "@/lib/validations/assignments";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  try {
    return successResponse(await getAssignment(auth.userId, id));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  const parsed = updateAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid assignment",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    return successResponse(
      await updateAssignment(auth.userId, id, parsed.data),
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  try {
    await deleteAssignment(auth.userId, id);
    return successResponse({ id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
