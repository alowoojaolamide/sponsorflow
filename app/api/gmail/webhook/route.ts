import { NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRoleKey } from "@/lib/supabase-server";
import { getValidAccessToken, listHistorySince, getGmailMessage } from "@/lib/gmail";
import { classifyReply } from "@/lib/reply-classification";

// Google Cloud Pub/Sub push message envelope.
type PubSubPushBody = {
  message: { data: string; messageId: string; publishTime: string };
  subscription: string;
};

function verifyWebhookSecret(req: Request): boolean {
  const configured = process.env.GMAIL_WEBHOOK_SECRET;
  if (!configured || configured.includes("your-random-webhook-secret")) {
    // No real secret configured — accept (dev-only fallback), matches how
    // the other integrations here degrade gracefully rather than crash.
    return true;
  }
  const url = new URL(req.url);
  return url.searchParams.get("token") === configured;
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
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

  const gmail = await getValidAccessToken(supabaseAdmin, connection.user_id);
  if (!gmail) {
    return NextResponse.json({ success: true, skipped: "no_valid_token" });
  }

  const since = connection.history_id ?? decoded.historyId;
  const { messages, newHistoryId } = await listHistorySince(gmail.accessToken, since);

  let processed = 0;

  for (const msg of messages) {
    const { data: outreachEmail } = await supabaseAdmin
      .from("outreach_emails")
      .select("*")
      .eq("gmail_thread_id", msg.threadId)
      .eq("user_id", connection.user_id)
      .maybeSingle();

    if (!outreachEmail) continue; // not a reply to one of our sent threads

    const detail = await getGmailMessage(gmail.accessToken, msg.id);

    const { data: alreadyLogged } = await supabaseAdmin
      .from("email_replies")
      .select("id")
      .eq("outreach_email_id", outreachEmail.id)
      .eq("from_email", detail.from)
      .eq("subject", detail.subject)
      .maybeSingle();
    if (alreadyLogged) continue;

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
  }

  await supabaseAdmin
    .from("gmail_connections")
    .update({ history_id: newHistoryId })
    .eq("user_id", connection.user_id);

  return NextResponse.json({ success: true, processed });
}
