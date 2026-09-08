import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { exchangeGmailCode, getGmailProfile } from "@/lib/gmail";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!code || state !== user.id) {
    return NextResponse.redirect(new URL("/profile?gmail_error=invalid_request", req.url));
  }

  try {
    const tokens = await exchangeGmailCode(code);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on first consent; if the user
      // already granted access before, they must revoke and reconnect.
      return NextResponse.redirect(new URL("/profile?gmail_error=no_refresh_token", req.url));
    }

    const profile = await getGmailProfile(tokens.access_token);

    const supabase = createSupabaseRouteClient();
    await supabase.from("gmail_connections").upsert(
      {
        user_id: user.id,
        gmail_email: profile.emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope,
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(new URL("/profile?gmail_connected=1", req.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return NextResponse.redirect(
      new URL(`/profile?gmail_error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
