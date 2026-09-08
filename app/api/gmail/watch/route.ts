import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getValidAccessToken, watchGmailInbox } from "@/lib/gmail";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const gmail = await getValidAccessToken(supabase, user.id);
  if (!gmail) {
    return NextResponse.json({ error: "Gmail is not connected" }, { status: 400 });
  }

  try {
    const { historyId, expiration } = await watchGmailInbox(gmail.accessToken);

    await supabase
      .from("gmail_connections")
      .update({ history_id: historyId, watch_expiration: expiration })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, history_id: historyId, expires_at: expiration });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register watch" },
      { status: 500 }
    );
  }
}
