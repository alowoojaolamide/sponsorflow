import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { discoverJobsForCompany } from "@/lib/job-discovery";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const jobs = await discoverJobsForCompany(
      company.company_name,
      company.website,
      company.career_page,
      extraKeywords
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
