import type { ZodType } from "zod";

import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  errorResponse,
  successResponse,
  toErrorResponse,
} from "@/lib/server/api-response";

type Ctx = { params: Promise<{ id: string }> };

async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<
      string,
      string[]
    >;
    return {
      ok: false,
      response: errorResponse("validation", "Invalid request body", fieldErrors),
    };
  }
  return { ok: true, data: parsed.data };
}

export function collectionRoute<TCreate>(opts: {
  list: (userId: string, request: Request) => Promise<unknown>;
  create: (userId: string, input: TCreate) => Promise<unknown>;
  createSchema: ZodType<TCreate>;
}) {
  return {
    async GET(request: Request) {
      const auth = await requireAuthGuard(request);
      if (!auth.ok) return auth.response;
      try {
        return successResponse(await opts.list(auth.userId, request));
      } catch (error) {
        return toErrorResponse(error);
      }
    },
    async POST(request: Request) {
      const auth = await requireAuthGuard(request);
      if (!auth.ok) return auth.response;
      const parsed = await parseBody(request, opts.createSchema);
      if (!parsed.ok) return parsed.response;
      try {
        return successResponse(
          await opts.create(auth.userId, parsed.data),
          201,
        );
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}

export function itemRoute<TUpdate>(opts: {
  get: (userId: string, id: string) => Promise<unknown>;
  update: (userId: string, id: string, input: TUpdate) => Promise<unknown>;
  remove: (userId: string, id: string) => Promise<unknown>;
  updateSchema: ZodType<TUpdate>;
}) {
  return {
    async GET(request: Request, ctx: Ctx) {
      const auth = await requireAuthGuard(request);
      if (!auth.ok) return auth.response;
      const { id } = await ctx.params;
      try {
        return successResponse(await opts.get(auth.userId, id));
      } catch (error) {
        return toErrorResponse(error);
      }
    },
    async PATCH(request: Request, ctx: Ctx) {
      const auth = await requireAuthGuard(request);
      if (!auth.ok) return auth.response;
      const { id } = await ctx.params;
      const parsed = await parseBody(request, opts.updateSchema);
      if (!parsed.ok) return parsed.response;
      try {
        return successResponse(
          await opts.update(auth.userId, id, parsed.data),
        );
      } catch (error) {
        return toErrorResponse(error);
      }
    },
    async DELETE(request: Request, ctx: Ctx) {
      const auth = await requireAuthGuard(request);
      if (!auth.ok) return auth.response;
      const { id } = await ctx.params;
      try {
        await opts.remove(auth.userId, id);
        return successResponse({ id });
      } catch (error) {
        return toErrorResponse(error);
      }
    },
  };
}
