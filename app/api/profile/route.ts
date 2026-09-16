import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";
import {
  ensureProfileRow,
  getFullProfile,
  updateProfileFields,
  replaceIndustries,
  replaceSkills,
  replaceProjects,
  computeCompletionPercent,
} from "@/lib/db";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const supabase = createSupabaseRouteClient();
  await ensureProfileRow(supabase, user.id);
  const full = await getFullProfile(supabase, user.id);

  return NextResponse.json(full);
}

export async function PUT(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await req.json();
    const { profile, industries, skills, projects, complete } = body as {
      profile?: Record<string, unknown>;
      industries?: { industry: string; years_experience?: number; experience_description?: string; problems_solved?: string; motivation?: string }[];
      skills?: { skill_name: string; skill_category: string }[];
      projects?: { project_name: string; company_name?: string; year?: number; description?: string; role?: string; industry?: string; impact?: string }[];
      complete?: boolean;
    };

    const supabase = createSupabaseRouteClient();
    const row = await ensureProfileRow(supabase, user.id);

    if (profile) {
      await updateProfileFields(supabase, row.id, profile);
    }
    if (complete) {
      await updateProfileFields(supabase, row.id, { onboarding_complete: true });
    }
    if (industries) {
      await replaceIndustries(
        supabase,
        row.id,
        industries.map((i) => ({
          industry: i.industry,
          years_experience: i.years_experience ?? null,
          experience_description: i.experience_description ?? null,
          problems_solved: i.problems_solved ?? null,
          motivation: i.motivation ?? null,
        }))
      );
    }
    if (skills) {
      await replaceSkills(supabase, row.id, skills);
    }
    if (projects) {
      await replaceProjects(
        supabase,
        row.id,
        projects.map((p) => ({
          project_name: p.project_name,
          company_name: p.company_name ?? null,
          year: p.year ?? null,
          description: p.description ?? null,
          role: p.role ?? null,
          industry: p.industry ?? null,
          impact: p.impact ?? null,
        }))
      );
    }

    const full = await getFullProfile(supabase, user.id);
    const percent = computeCompletionPercent(full);
    await updateProfileFields(supabase, row.id, { profile_complete_percent: percent });

    return NextResponse.json({ success: true, profile_complete_percent: percent });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
