import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanies, isSortableColumn } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 2000);
  const offset = Number(searchParams.get("offset")) || 0;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const industry = searchParams.get("industry") || undefined;
  const sortParam = searchParams.get("sort") || undefined;
  const sort = sortParam && isSortableColumn(sortParam) ? sortParam : undefined;
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const supabase = createSupabaseRouteClient();
  const { companies, total } = await getCompanies(supabase, user.id, {
    limit,
    offset,
    search,
    status,
    industry,
    sort,
    order,
  });

  return NextResponse.json({ companies, total, limit, offset });
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
