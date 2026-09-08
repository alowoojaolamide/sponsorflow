import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import type { TablesUpdate } from "@/types/database";

const VALID_STATUSES = ["draft", "approved", "ready_to_send", "sending", "sent", "rejected"];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase
    .from("outreach_emails")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  return NextResponse.json({ email: data });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status, subject, body: emailBody } = body as {
      status?: string;
      subject?: string;
      body?: string;
    };

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: TablesUpdate<"outreach_emails"> = {};
    if (status) {
      updates.status = status;
      if (status === "approved" || status === "ready_to_send") {
        updates.approved_by_user = true;
        updates.approved_at = new Date().toISOString();
      }
    }
    if (subject !== undefined) updates.subject = subject;
    if (emailBody !== undefined) {
      updates.body = emailBody;
      updates.user_edits = emailBody;
    }

    const supabase = createSupabaseRouteClient();
    const { data, error } = await supabase
      .from("outreach_emails")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, email: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
