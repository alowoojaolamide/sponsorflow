import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getCompanies, isSortableColumn } from "@/lib/db";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 2000);
  const offset = Number(searchParams.get("offset")) || 0;
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const industry = searchParams.get("industry") || undefined;
  const sortParam = searchParams.get("sort") || undefined;
  const sort = sortParam && isSortableColumn(sortParam) ? sortParam : undefined;
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const scannedParam = searchParams.get("scanned");
  const scanned = scannedParam === "false" ? false : scannedParam === "true" ? true : undefined;
  const researchedParam = searchParams.get("researched");
  const researched = researchedParam === "false" ? false : researchedParam === "true" ? true : undefined;
  const hasWebsiteParam = searchParams.get("has_website");
  const hasWebsite = hasWebsiteParam === "false" ? false : hasWebsiteParam === "true" ? true : undefined;
  const likelyTech = searchParams.get("likely_tech") === "true";

  const supabase = createSupabaseRouteClient();
  const { companies, total } = await getCompanies(supabase, user.id, {
    limit,
    offset,
    search,
    status,
    industry,
    sort,
    order,
    scanned,
    researched,
    hasWebsite,
    likelyTech,
  });

  return NextResponse.json({ companies, total, limit, offset });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

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
    return handleApiError(err);
  }
}
