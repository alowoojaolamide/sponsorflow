import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { researchCompany, isResearchConfigured } from "@/lib/company-research";
import type { TablesUpdate } from "@/types/database";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResearchConfigured()) {
    return NextResponse.json(
      { error: "Company research is not configured yet (OPENAI_API_KEY missing)." },
      { status: 503 }
    );
  }

  const supabase = createSupabaseRouteClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (companyError || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  try {
    const result = await researchCompany(company.company_name, company.industry);

    const updates: TablesUpdate<"companies"> = { researched_at: new Date().toISOString() };
    // Never clobber data the user already has (a manually-set or CSV-imported
    // website/hook is more trustworthy than an AI guess).
    if (result.website && !company.website) updates.website = result.website;
    if (result.personalization_hook && !company.personalization_hook) {
      updates.personalization_hook = result.personalization_hook;
    }

    const { data: updated, error: updateError } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", company.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ found: result.found, company: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
