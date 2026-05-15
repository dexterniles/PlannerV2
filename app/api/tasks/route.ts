import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";
import { createTask, listTasks } from "@/lib/server/data/tasks";
import { createTaskSchema } from "@/lib/validations/tasks";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const data = await listTasks(auth.userId);
  return successResponse(data);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      "validation",
      "Invalid task",
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const data = await createTask(auth.userId, parsed.data);
    return successResponse(data, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
