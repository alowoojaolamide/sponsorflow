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
    const { email_ids } = await req.json();
    if (!Array.isArray(email_ids) || email_ids.length === 0) {
      return NextResponse.json({ error: "email_ids must be a non-empty array" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();

    let sent = 0;
    let failed = 0;
    let rateLimitWarning: string | null = null;
    const results = [];

    for (const id of email_ids) {
      const result = await sendOutreachEmail(supabase, user.id, id);
      results.push(result);
      if (result.ok) {
        sent++;
      } else {
        failed++;
        if (result.error.toLowerCase().includes("limit")) {
          rateLimitWarning = result.error;
          break; // stop the batch once a rate limit is hit
        }
      }
    }

    return NextResponse.json({
      total: email_ids.length,
      sent,
      failed,
      rate_limit_warning: rateLimitWarning,
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
