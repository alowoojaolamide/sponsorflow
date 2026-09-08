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

/** Sends an email via the Gmail API using a valid access token. Returns the Gmail message id. */
export async function sendGmailMessage(
  accessToken: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string
): Promise<string> {
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
  return data.id as string;
}
