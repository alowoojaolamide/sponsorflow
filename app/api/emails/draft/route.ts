import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getFullProfile } from "@/lib/db";
import { generateEmailDraft, isClaudeConfigured } from "@/lib/ai-email";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isClaudeConfigured()) {
    return NextResponse.json(
      { error: "AI email generation is not configured yet (ANTHROPIC_API_KEY missing)." },
      { status: 503 }
    );
  }

  try {
    const { company_id, contact_id } = await req.json();
    if (!company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .eq("user_id", user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let contact = null;
    if (contact_id) {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contact_id)
        .eq("user_id", user.id)
        .maybeSingle();
      contact = data;
    }

    const full = await getFullProfile(supabase, user.id);
    if (!full.profile) {
      return NextResponse.json(
        { error: "Complete your profile onboarding before generating emails" },
        { status: 400 }
      );
    }

    const draft = await generateEmailDraft(full.profile, full.industries, full.projects, company);

    const toEmail =
      contact?.email ??
      (company.website
        ? `careers@${company.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}`
        : "");

    return NextResponse.json({
      company_id: company.id,
      company_name: company.company_name,
      contact_id: contact?.id ?? null,
      to_email: toEmail,
      to_name: contact?.name ?? null,
      ...draft,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
