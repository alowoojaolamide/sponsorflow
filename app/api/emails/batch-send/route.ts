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
    return handleApiError(err);
  }
}
