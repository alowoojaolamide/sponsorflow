import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { sendOutreachEmail, type SendResult } from "@/lib/send-email";
import { handleApiError } from "@/lib/api-helpers";
import { runWithConcurrency } from "@/lib/utils";

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
    let stopped = false;
    const results: SendResult[] = [];

    // Sends a few at a time instead of strictly one-at-a-time — safe now
    // that checkAndConsumeSendLimit is an atomic DB-level guard (a fixed
    // race from an earlier pass), so concurrent sends can't blow through
    // the daily/hourly cap even though several may be in flight when the
    // limit is first hit.
    await runWithConcurrency(
      email_ids as string[],
      3,
      (id) => sendOutreachEmail(supabase, user.id, id),
      (_id, _index, result) => {
        if (!result) return;
        results.push(result);
        if (result.ok) {
          sent++;
        } else {
          failed++;
          if (result.error.toLowerCase().includes("limit")) {
            rateLimitWarning = result.error;
            stopped = true; // stop picking up new sends once the cap is hit
          }
        }
      },
      () => stopped
    );

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
