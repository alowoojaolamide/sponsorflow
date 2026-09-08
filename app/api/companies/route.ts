import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanies } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const companies = await getCompanies(supabase, user.id);

  return NextResponse.json({ companies, total: companies.length });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.company_name) {
      return NextResponse.json({ error: "company_name is required" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const { data, error } = await supabase
      .from("companies")
      .insert({
        user_id: user.id,
        company_name: body.company_name,
        website: body.website ?? null,
        industry: body.industry ?? null,
        career_page: body.career_page ?? null,
        personalization_hook: body.personalization_hook ?? null,
        campaign_tag: body.campaign_tag ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, company: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
