import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGmailAuthUrl, isGmailOAuthConfigured } from "@/lib/gmail";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGmailOAuthConfigured()) {
    return NextResponse.json(
      { error: "Gmail integration is not configured yet (GOOGLE_CLIENT_ID/SECRET missing)." },
      { status: 503 }
    );
  }

  const url = getGmailAuthUrl(user.id);
  return NextResponse.redirect(url);
}
