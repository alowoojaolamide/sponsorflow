import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import { ensureProfileRow } from "@/lib/db";
import { uploadResume, deleteResume } from "@/lib/resume-storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const formData = await req.formData();
    const file = formData.get("resume");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Resume must be under 5MB" }, { status: 400 });
    }
    if (!/\.(pdf|docx?|)$/i.test(file.name) || !file.name.includes(".")) {
      return NextResponse.json({ error: "Resume must be a PDF or Word document" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const row = await ensureProfileRow(supabase, user.id);

    const result = await uploadResume(supabase, user.id, row.id, file, row.resume_storage_path);

    return NextResponse.json({ success: true, filename: result.filename });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const supabase = createSupabaseRouteClient();
    const row = await ensureProfileRow(supabase, user.id);
    if (row.resume_storage_path) {
      await deleteResume(supabase, row.id, row.resume_storage_path);
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
