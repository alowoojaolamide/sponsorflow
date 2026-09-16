import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { sendOutreachEmail } from "@/lib/send-email";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { outreach_email_id } = await req.json();
    if (!outreach_email_id) {
      return NextResponse.json({ error: "outreach_email_id is required" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const result = await sendOutreachEmail(supabase, user.id, outreach_email_id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, sent_at: new Date().toISOString(), tracking_id: result.gmailMessageId });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
