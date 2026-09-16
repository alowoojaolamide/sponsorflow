import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { getAiUsageState } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const state = await getAiUsageState(supabase, user.id);

  return NextResponse.json(state);
}
