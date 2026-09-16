import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { getValidAccessToken, sendGmailMessage } from "@/lib/gmail";
import { checkAndConsumeSendLimit, releaseSendLimit } from "@/lib/rate-limit";
import { buildTrackedHtmlBody } from "@/lib/email-tracking";

type DB = SupabaseClient<Database>;

export type SendResult =
  | { ok: true; emailId: string; gmailMessageId: string }
  | { ok: false; emailId: string; error: string };

export async function sendOutreachEmail(supabase: DB, userId: string, emailId: string): Promise<SendResult> {
  const { data: email, error: fetchError } = await supabase
    .from("outreach_emails")
    .select("*")
    .eq("id", emailId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !email) {
    return { ok: false, emailId, error: "Email not found" };
  }

  if (email.status !== "ready_to_send" && email.status !== "approved") {
    return { ok: false, emailId, error: `Email is not ready to send (status: ${email.status})` };
  }

  const gmail = await getValidAccessToken(supabase, userId);
  if (!gmail) {
    return { ok: false, emailId, error: "Gmail is not connected. Connect Gmail from your profile page first." };
  }

  const limit = await checkAndConsumeSendLimit(supabase, userId);
  if (!limit.allowed) {
    return { ok: false, emailId, error: limit.reason };
  }

  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("portfolio_url, linkedin_url")
      .eq("user_id", userId)
      .maybeSingle();

    const htmlBody = buildTrackedHtmlBody(email.body, emailId, {
      portfolioUrl: profile?.portfolio_url,
      linkedinUrl: profile?.linkedin_url,
    });

    const sent = await sendGmailMessage(
      gmail.accessToken,
      gmail.connection.gmail_email,
      email.to_email,
      email.subject,
      email.body,
      htmlBody
    );

    await supabase
      .from("outreach_emails")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivery_status: "sent",
        gmail_message_id: sent.id,
        gmail_thread_id: sent.threadId,
      })
      .eq("id", emailId);

    await supabase.from("email_events").insert({ outreach_email_id: emailId, event_type: "sent" });

    return { ok: true, emailId, gmailMessageId: sent.id };
  } catch (err: unknown) {
    await supabase.from("outreach_emails").update({ delivery_status: "failed" }).eq("id", emailId);
    // The send-limit slot was reserved before the (failed) send attempt —
    // Gmail's send call is atomic (it either returns a sent message or
    // throws with nothing sent), so it's safe to give the slot back rather
    // than let a transient failure permanently cost the user real capacity.
    await releaseSendLimit(supabase, userId).catch(() => {});
    return { ok: false, emailId, error: err instanceof Error ? err.message : "Send failed" };
  }
}
