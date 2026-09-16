import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGmailAuthUrl, isGmailOAuthConfigured } from "@/lib/gmail";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (!isGmailOAuthConfigured()) {
    return NextResponse.json(
      { error: "Gmail integration is not configured yet (GOOGLE_CLIENT_ID/SECRET missing)." },
      { status: 503 }
    );
  }

  const url = getGmailAuthUrl(user.id);
  return NextResponse.redirect(url);
}
