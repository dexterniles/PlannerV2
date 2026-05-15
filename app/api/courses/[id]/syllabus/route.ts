import { requireAuthGuard } from "@/lib/auth/require-auth";
import { errorResponse, successResponse } from "@/lib/server/api-response";
import { getCourse, setCourseSyllabus } from "@/lib/server/data/courses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "syllabi";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
]);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const course = await getCourse(auth.userId, id).catch(() => null);
  if (!course) return errorResponse("not_found", "Course not found");
  if (!course.syllabusFilePath) {
    return errorResponse("not_found", "No syllabus uploaded");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(course.syllabusFilePath, 60);
  if (error || !data) {
    return errorResponse("internal", "Could not create signed URL");
  }
  return successResponse({ url: data.signedUrl, name: course.syllabusName });
}

export async function POST(request: Request, ctx: Ctx) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const course = await getCourse(auth.userId, id).catch(() => null);
  if (!course) return errorResponse("not_found", "Course not found");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return errorResponse("validation", "Expected a file upload");
  }
  if (file.size > MAX_BYTES) {
    return errorResponse("validation", "File exceeds 10MB limit");
  }
  if (!ALLOWED.has(file.type)) {
    return errorResponse("validation", "Unsupported file type");
  }

  const path = `${auth.userId}/${id}/${file.name}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    return errorResponse("internal", "Upload failed");
  }

  await setCourseSyllabus(auth.userId, id, path, file.name);
  return successResponse({ path, name: file.name }, 201);
}
