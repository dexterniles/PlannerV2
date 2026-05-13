export type ErrorCode =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

const STATUS: Record<ErrorCode, number> = {
  validation: 400,
  unauthorized: 401,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal: 500,
};

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string[]>,
) {
  const payload: { code: ErrorCode; message: string; fields?: Record<string, string[]> } = {
    code,
    message,
  };
  if (fields) payload.fields = fields;
  return Response.json({ error: payload }, { status: STATUS[code] });
}

export class HttpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFound(message = "Not found"): never {
  throw new HttpError("not_found", message);
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.code, error.message, error.fields);
  }
  return errorResponse("internal", "Internal server error");
}
