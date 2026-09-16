import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { isGmailOAuthConfigured } from "@/lib/gmail";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const { data } = await supabase
    .from("gmail_connections")
    .select("gmail_email, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    configured: isGmailOAuthConfigured(),
    connected: !!data,
    gmail_email: data?.gmail_email ?? null,
  });
}

export async function DELETE() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  await supabase.from("gmail_connections").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
