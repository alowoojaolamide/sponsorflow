import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getJobPostings } from "@/lib/db";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id") || undefined;
  const status = searchParams.get("status") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const offset = Number(searchParams.get("offset")) || undefined;

  const { jobs, total } = await getJobPostings(supabase, user.id, { companyId, status, limit, offset });

  return NextResponse.json({ jobs, total });
}
