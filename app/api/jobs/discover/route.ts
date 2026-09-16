import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { discoverJobsForCompany } from "@/lib/job-discovery";
import { checkAndConsumeAiCall } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { company_id } = await req.json();
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

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("target_job_title")
      .eq("user_id", user.id)
      .maybeSingle();

    const extraKeywords = profile?.target_job_title ? [profile.target_job_title] : [];

    // Only the AI career-page-extraction fallback inside discoverJobsForCompany
    // spends OpenAI budget — the Greenhouse/Lever slug guessing is free. Gate
    // just that step so a "no explicit career page" result never blocks the
    // free part of discovery, while still capping how many AI calls a batch
    // scan across thousands of companies can fire.
    const aiGate = async () => (await checkAndConsumeAiCall(supabase, user.id)).allowed;

    const jobs = await discoverJobsForCompany(
      company.company_name,
      company.website,
      company.career_page,
      extraKeywords,
      aiGate
    );

    // Mark scanned regardless of outcome so a batch re-run can skip this
    // company and resume from where it left off instead of re-scanning
    // everyone from the start every time.
    await supabase.from("companies").update({ jobs_scanned_at: new Date().toISOString() }).eq("id", company.id);

    if (jobs.length === 0) {
      return NextResponse.json({ found: 0, jobs: [], no_career_page: !company.career_page });
    }

    const { data: saved, error: saveError } = await supabase
      .from("job_postings")
      .upsert(
        jobs.map((j) => ({
          user_id: user.id,
          company_id: company.id,
          source: j.source,
          external_id: j.external_id,
          title: j.title,
          url: j.url,
          location: j.location,
          description: j.description,
        })),
        { onConflict: "user_id,company_id,external_id" }
      )
      .select("*");

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    return NextResponse.json({ found: saved?.length ?? 0, jobs: saved ?? [] });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
