import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { sendOutreachEmail } from "@/lib/send-email";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
