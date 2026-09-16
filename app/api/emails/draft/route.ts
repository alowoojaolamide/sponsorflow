import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getFullProfile } from "@/lib/db";
import { generateEmailDraft, isAIConfigured } from "@/lib/ai-email";
import { checkAndConsumeAiCall } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI email generation is not configured yet (OPENAI_API_KEY missing)." },
      { status: 503 }
    );
  }

  try {
    const { company_id, contact_id, job_title, job_url, job_description } = await req.json();
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

    const aiLimit = await checkAndConsumeAiCall(supabase, user.id);
    if (!aiLimit.allowed) {
      return NextResponse.json({ error: aiLimit.reason, code: "ai_cap_reached" }, { status: 429 });
    }

    const job = job_title ? { title: job_title, url: job_url ?? null, description: job_description ?? null } : null;
    const draft = await generateEmailDraft(full.profile, full.industries, full.projects, company, job);

    const toEmail =
      (contact?.email ? contact.email : null) ??
      (company.website
        ? `careers@${company.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}`
        : "");

    return NextResponse.json({
      company_id: company.id,
      company_name: company.company_name,
      contact_id: contact?.id ?? null,
      to_email: toEmail,
      to_name: contact?.name ?? null,
      job_title: job?.title ?? null,
      job_url: job?.url ?? null,
      ...draft,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
