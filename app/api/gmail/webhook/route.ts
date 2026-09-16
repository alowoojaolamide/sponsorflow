import { NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-server";
import { getValidAccessToken, listHistorySince, getGmailMessage } from "@/lib/gmail";
import { classifyReply } from "@/lib/reply-classification";

// Google Cloud Pub/Sub push message envelope.
type PubSubPushBody = {
  message: { data: string; messageId: string; publishTime: string };
  subscription: string;
};

/**
 * Fails CLOSED: an unset/placeholder GMAIL_WEBHOOK_SECRET now rejects every
 * request instead of accepting everything. This endpoint uses the
 * RLS-bypassing service-role client (necessary since Google, not a
 * signed-in user, calls it) — without a real secret there is nothing
 * distinguishing a genuine Pub/Sub push from anyone who finds the URL.
 */
function verifyWebhookSecret(req: Request): boolean {
  const configured = process.env.GMAIL_WEBHOOK_SECRET;
  if (!configured || configured.includes("your-random-webhook-secret")) {
    return false;
  }
  const url = new URL(req.url);
  return url.searchParams.get("token") === configured;
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json(
      { error: "Invalid or missing webhook token. Set a real GMAIL_WEBHOOK_SECRET and configure the Pub/Sub push subscription to include ?token=<that value>." },
      { status: 401 }
    );
  }

  if (!hasServiceRoleKey) {
    // This endpoint is called by Google, not a signed-in user, so it must
    // bypass RLS with the service-role key to look up the right user and
    // write on their behalf. Without it, there's no authenticated context
    // that could satisfy RLS at all.
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured; webhook cannot process replies yet." },
      { status: 503 }
    );
  }

  let payload: PubSubPushBody;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid Pub/Sub payload" }, { status: 400 });
  }

  const decoded = JSON.parse(Buffer.from(payload.message.data, "base64").toString("utf-8")) as {
    emailAddress: string;
    historyId: string;
  };

  const { data: connection } = await supabaseAdmin
    .from("gmail_connections")
    .select("*")
    .eq("gmail_email", decoded.emailAddress)
    .maybeSingle();

  if (!connection) {
    // Not one of our connected accounts — ack anyway so Pub/Sub doesn't retry forever.
    return NextResponse.json({ success: true, skipped: "unknown_account" });
  }

  let gmail: Awaited<ReturnType<typeof getValidAccessToken>>;
  try {
    gmail = await getValidAccessToken(supabaseAdmin, connection.user_id);
  } catch {
    // Refresh token was rejected (e.g. the user revoked Gmail access) —
    // ack anyway rather than let Pub/Sub retry the same failure forever.
    return NextResponse.json({ success: true, skipped: "token_refresh_failed" });
  }
  if (!gmail) {
    return NextResponse.json({ success: true, skipped: "no_valid_token" });
  }

  const since = connection.history_id ?? decoded.historyId;
  const { messages, newHistoryId } = await listHistorySince(gmail.accessToken, since);

  let processed = 0;
  let failed = 0;

  if (messages.length > 0) {
    // Batch both lookups upfront instead of one round trip per message.
    const threadIds = Array.from(new Set(messages.map((m) => m.threadId)));
    const { data: matchingEmails } = await supabaseAdmin
      .from("outreach_emails")
      .select("*")
      .eq("user_id", connection.user_id)
      .in("gmail_thread_id", threadIds);

    const emailByThreadId = new Map((matchingEmails ?? []).map((e) => [e.gmail_thread_id, e]));

    const outreachEmailIds = (matchingEmails ?? []).map((e) => e.id);
    const { data: existingReplies } =
      outreachEmailIds.length > 0
        ? await supabaseAdmin
            .from("email_replies")
            .select("outreach_email_id, from_email, subject")
            .in("outreach_email_id", outreachEmailIds)
        : { data: [] };

    const loggedKeys = new Set(
      (existingReplies ?? []).map((r) => `${r.outreach_email_id}::${r.from_email}::${r.subject}`)
    );

    for (const msg of messages) {
      const outreachEmail = emailByThreadId.get(msg.threadId);
      if (!outreachEmail) continue; // not a reply to one of our sent threads

      // One bad message (deleted since the history event, a transient Gmail
      // API error, etc.) must not abort the rest of the batch or block
      // history_id from advancing below — that would permanently stall
      // reply ingestion for this mailbox on every retry.
      try {
        const detail = await getGmailMessage(gmail.accessToken, msg.id);

        const key = `${outreachEmail.id}::${detail.from}::${detail.subject}`;
        if (loggedKeys.has(key)) continue;

        const classification = await classifyReply(detail.body);

        await supabaseAdmin.from("email_replies").insert({
          user_id: connection.user_id,
          outreach_email_id: outreachEmail.id,
          from_email: detail.from,
          subject: detail.subject,
          body: detail.body,
          ai_classification: classification.classification,
          ai_confidence: classification.confidence,
          ai_summary: classification.summary,
        });

        await supabaseAdmin.from("outreach_emails").update({ status: "replied" }).eq("id", outreachEmail.id);
        processed++;
      } catch {
        failed++;
      }
    }
  }

  await supabaseAdmin
    .from("gmail_connections")
    .update({ history_id: newHistoryId })
    .eq("user_id", connection.user_id);

  return NextResponse.json({ success: true, processed, failed });
}
