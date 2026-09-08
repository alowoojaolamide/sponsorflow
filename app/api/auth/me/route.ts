import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
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
