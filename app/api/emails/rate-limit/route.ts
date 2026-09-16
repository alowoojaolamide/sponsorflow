import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getRateLimitState } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const state = await getRateLimitState(supabase, user.id);

  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);

  return NextResponse.json({ ...state, reset_at: resetAt.toISOString() });
}
