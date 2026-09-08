import type { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database";

type DB = SupabaseClient<Database>;

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function credentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const configured =
    !!clientId &&
    !!clientSecret &&
    !clientId.includes("your-google-client-id") &&
    !clientSecret.includes("your-google-client-secret");

  return { clientId, clientSecret, appUrl, configured };
}

export function isGmailOAuthConfigured(): boolean {
  return credentials().configured;
}

export function getGmailAuthUrl(state: string): string {
  const { clientId, appUrl } = credentials();
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: `${appUrl}/api/gmail/callback`,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeGmailCode(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, appUrl, configured } = credentials();
  if (!configured) {
    throw new Error("Gmail OAuth is not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing).");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${appUrl}/api/gmail/callback`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, configured } = credentials();
  if (!configured) {
    throw new Error("Gmail OAuth is not configured.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token refresh failed: ${body}`);
  }

  return res.json();
}

export async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string }> {
  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Gmail profile");
  return res.json();
}

/** Returns a valid (non-expired) access token for the user, refreshing it if needed. */
export async function getValidAccessToken(
  supabase: DB,
  userId: string
): Promise<{ accessToken: string; connection: Tables<"gmail_connections"> } | null> {
  const { data: connection } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) return null;

  const expiresAt = new Date(connection.token_expires_at).getTime();
  if (expiresAt > Date.now() + 60_000) {
    return { accessToken: connection.access_token, connection };
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  const { data: updated } = await supabase
    .from("gmail_connections")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiresAt })
    .eq("user_id", userId)
    .select("*")
    .single();

  return { accessToken: refreshed.access_token, connection: updated ?? connection };
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Sends an email via the Gmail API using a valid access token. */
export async function sendGmailMessage(
  accessToken: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const rawMessage = [
    `From: ${fromEmail}`,
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gmail send failed: ${errBody}`);
  }

  const data = await res.json();
  return { id: data.id as string, threadId: data.threadId as string };
}

/** Registers (or renews) a Gmail push notification watch on the user's inbox. */
export async function watchGmailInbox(
  accessToken: string
): Promise<{ historyId: string; expiration: string }> {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName || topicName.includes("your-gcp-project")) {
    throw new Error("GMAIL_PUBSUB_TOPIC is not configured.");
  }

  const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topicName, labelIds: ["INBOX"] }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail watch registration failed: ${body}`);
  }

  const data = await res.json();
  return { historyId: data.historyId, expiration: new Date(Number(data.expiration)).toISOString() };
}

type GmailHistoryMessage = { id: string; threadId: string };

/** Lists new inbox messages since a given historyId. */
export async function listHistorySince(
  accessToken: string,
  startHistoryId: string
): Promise<{ messages: GmailHistoryMessage[]; newHistoryId: string }> {
  const params = new URLSearchParams({
    startHistoryId,
    historyTypes: "messageAdded",
    labelId: "INBOX",
  });

  const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/history?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    // A 404 typically means startHistoryId is too old (mailbox history expired).
    return { messages: [], newHistoryId: startHistoryId };
  }

  const data = await res.json();
  const messages: GmailHistoryMessage[] = (data.history ?? []).flatMap(
    (h: { messagesAdded?: { message: GmailHistoryMessage }[] }) =>
      (h.messagesAdded ?? []).map((m) => m.message)
  );

  return { messages, newHistoryId: data.historyId ?? startHistoryId };
}

export type GmailMessageDetail = {
  threadId: string;
  from: string;
  subject: string;
  body: string;
  inReplyTo: string | null;
};

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractPlainTextBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: { mimeType?: string; body?: { data?: string } }[];
}): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  const plainPart = payload.parts?.find((p) => p.mimeType === "text/plain");
  if (plainPart?.body?.data) return decodeBase64Url(plainPart.body.data);
  const htmlPart = payload.parts?.find((p) => p.mimeType === "text/html");
  if (htmlPart?.body?.data) return decodeBase64Url(htmlPart.body.data).replace(/<[^>]+>/g, " ");
  return "";
}

export async function getGmailMessage(accessToken: string, messageId: string): Promise<GmailMessageDetail> {
  const res = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch Gmail message");
  const data = await res.json();

  const headers: { name: string; value: string }[] = data.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;

  return {
    threadId: data.threadId,
    from: getHeader("From") ?? "",
    subject: getHeader("Subject") ?? "",
    body: extractPlainTextBody(data.payload ?? {}),
    inReplyTo: getHeader("In-Reply-To"),
  };
}
