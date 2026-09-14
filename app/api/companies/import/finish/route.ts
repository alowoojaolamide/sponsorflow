import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { import_id, companies_imported, companies_duplicates } = await req.json();
    if (!import_id) {
      return NextResponse.json({ error: "import_id is required" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const { error } = await supabase
      .from("company_imports")
      .update({
        companies_imported: companies_imported ?? 0,
        companies_duplicates: companies_duplicates ?? 0,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", import_id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
