import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getFullProfile } from "@/lib/db";
import { generateLinkedInMessage, isAIConfigured } from "@/lib/ai-linkedin";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: "AI message generation is not configured yet (OPENAI_API_KEY missing)." },
      { status: 503 }
    );
  }

  try {
    const { company_id, job_title, job_url, job_description } = await req.json();
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

    const full = await getFullProfile(supabase, user.id);
    if (!full.profile) {
      return NextResponse.json(
        { error: "Complete your profile onboarding before generating messages" },
        { status: 400 }
      );
    }

    const job = job_title ? { title: job_title, url: job_url ?? null, description: job_description ?? null } : null;
    const draft = await generateLinkedInMessage(full.profile, full.industries, full.projects, company, job);

    return NextResponse.json({
      company_id: company.id,
      company_name: company.company_name,
      ...draft,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
