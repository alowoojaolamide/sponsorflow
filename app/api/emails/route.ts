import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getOutreachEmails } from "@/lib/db";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  const [emails, { count: pendingCount }] = await Promise.all([
    getOutreachEmails(supabase, user.id, { status }),
    supabase
      .from("outreach_emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "draft"),
  ]);

  return NextResponse.json({ emails, pendingCount: pendingCount ?? 0 });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const {
      company_id,
      contact_id,
      to_email,
      to_name,
      subject,
      body: emailBody,
      positioning_angle,
      confidence,
      job_title,
      job_url,
    } = body;

    if (!company_id || !to_email || !subject || !emailBody) {
      return NextResponse.json(
        { error: "company_id, to_email, subject, and body are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseRouteClient();

    // Every other write path (emails/draft, linkedin/draft, jobs/discover,
    // companies/[id]/research) verifies the referenced company/contact
    // belongs to the caller before using it — this one didn't.
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("id", company_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    if (contact_id) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("id")
        .eq("id", contact_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from("outreach_emails")
      .insert({
        user_id: user.id,
        company_id,
        contact_id: contact_id ?? null,
        to_email,
        to_name: to_name ?? null,
        subject,
        body: emailBody,
        status: "draft",
        ai_model: "gpt-4o-mini",
        ai_positioning_angle: positioning_angle ?? null,
        ai_confidence: confidence ?? null,
        job_title: job_title ?? null,
        job_url: job_url ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: data });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
