import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_complete, profile_complete_percent")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    profile_status: profile
      ? {
          onboarding_complete: profile.onboarding_complete,
          profile_complete_percent: profile.profile_complete_percent,
        }
      : { onboarding_complete: false, profile_complete_percent: 0 },
  });
}
