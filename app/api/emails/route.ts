import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getOutreachEmails } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let emails = await getOutreachEmails(supabase, user.id);
  if (status) {
    emails = emails.filter((e) => e.status === status);
  }

  const pendingCount = emails.filter((e) => e.status === "draft").length;

  return NextResponse.json({ emails, pendingCount });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    } = body;

    if (!company_id || !to_email || !subject || !emailBody) {
      return NextResponse.json(
        { error: "company_id, to_email, subject, and body are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseRouteClient();
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
        ai_model: "claude-sonnet-4-5",
        ai_positioning_angle: positioning_angle ?? null,
        ai_confidence: confidence ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, email: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
