import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getRateLimitState } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseRouteClient();
  const state = await getRateLimitState(supabase, user.id);

  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);

  return NextResponse.json({ ...state, reset_at: resetAt.toISOString() });
}
