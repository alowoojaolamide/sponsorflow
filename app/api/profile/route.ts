import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    profile: {
      location: "London, UK",
      years_experience: 4,
      target_job_title: "Senior Product Designer",
      requires_sponsorship: true,
      onboarding_complete: false,
      profile_complete_percent: 40,
    },
  });
}

export async function PUT(req: Request) {
  const data = await req.json();
  return NextResponse.json({ success: true, updated: data });
}
