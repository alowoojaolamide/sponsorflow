import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");
  const status = searchParams.get("status");

  let query = supabase.from("job_postings").select("*").eq("user_id", user.id);
  if (companyId) query = query.eq("company_id", companyId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.order("discovered_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}
