import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { file_name, file_size, total_companies } = await req.json();

    const supabase = createSupabaseRouteClient();
    const { data: importRow, error } = await supabase
      .from("company_imports")
      .insert({
        user_id: user.id,
        file_name: file_name || "upload.csv",
        file_size: file_size ?? null,
        companies_found: total_companies ?? 0,
        status: "processing",
      })
      .select("*")
      .single();

    if (error || !importRow) {
      return NextResponse.json({ error: error?.message ?? "Failed to start import" }, { status: 500 });
    }

    return NextResponse.json({ import_id: importRow.id });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
