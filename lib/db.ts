import type { SupabaseClient } from "@supabase/supabase-js";
import { Database, Tables } from "@/types/database";

type DB = SupabaseClient<Database>;

export type FullProfile = {
  profile: Tables<"user_profiles"> | null;
  industries: Tables<"user_industries">[];
  skills: Tables<"user_skills">[];
  projects: Tables<"user_projects">[];
};

export async function getFullProfile(supabase: DB, userId: string): Promise<FullProfile> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    return { profile: null, industries: [], skills: [], projects: [] };
  }

  const [{ data: industries }, { data: skills }, { data: projects }] = await Promise.all([
    supabase.from("user_industries").select("*").eq("profile_id", profile.id),
    supabase.from("user_skills").select("*").eq("profile_id", profile.id),
    supabase.from("user_projects").select("*").eq("profile_id", profile.id),
  ]);

  return {
    profile,
    industries: industries ?? [],
    skills: skills ?? [],
    projects: projects ?? [],
  };
}

/** Creates the user_profiles row for a user if it doesn't exist yet. */
export async function ensureProfileRow(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const { data: created, error } = await supabase
    .from("user_profiles")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

export async function updateProfileFields(
  supabase: DB,
  profileId: string,
  fields: Tables<"user_profiles"> extends infer T
    ? Partial<Omit<T, "id" | "user_id" | "created_at" | "updated_at">>
    : never
) {
  const { error } = await supabase.from("user_profiles").update(fields).eq("id", profileId);
  if (error) throw error;
}

/** Replaces all industries for a profile with the given set (delete-then-insert). */
export async function replaceIndustries(
  supabase: DB,
  profileId: string,
  industries: Omit<Tables<"user_industries">, "id" | "profile_id" | "created_at">[]
) {
  await supabase.from("user_industries").delete().eq("profile_id", profileId);
  if (industries.length === 0) return;
  const { error } = await supabase
    .from("user_industries")
    .insert(industries.map((i) => ({ ...i, profile_id: profileId })));
  if (error) throw error;
}

export async function replaceSkills(
  supabase: DB,
  profileId: string,
  skills: { skill_name: string; skill_category: string }[]
) {
  await supabase.from("user_skills").delete().eq("profile_id", profileId);
  if (skills.length === 0) return;
  const { error } = await supabase
    .from("user_skills")
    .insert(skills.map((s) => ({ ...s, profile_id: profileId })));
  if (error) throw error;
}

export async function replaceProjects(
  supabase: DB,
  profileId: string,
  projects: Omit<Tables<"user_projects">, "id" | "profile_id" | "created_at">[]
) {
  await supabase.from("user_projects").delete().eq("profile_id", profileId);
  if (projects.length === 0) return;
  const { error } = await supabase
    .from("user_projects")
    .insert(projects.map((p) => ({ ...p, profile_id: profileId })));
  if (error) throw error;
}

/** Recomputes profile_complete_percent from the current state of the profile. */
export function computeCompletionPercent(full: FullProfile): number {
  if (!full.profile) return 0;
  const p = full.profile;

  const checks = [
    true, // step 1: welcome (row exists)
    !!(p.location && p.years_experience && p.target_job_title), // step 2
    full.industries.length > 0, // step 3
    full.skills.filter((s) => s.skill_category === "design").length >= 3, // step 4
    full.projects.length > 0, // step 5
    !!(p.target_salary_gbp && p.availability), // step 6
    full.industries.some((i) => i.industry === "fintech" && i.experience_description), // step 7
    full.industries.some((i) => i.industry === "healthcare" && i.experience_description), // step 8
    !!p.professional_summary, // step 9
    p.onboarding_complete, // step 10
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export async function getExistingNormalizedNames(supabase: DB, userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("companies")
    .select("normalized_name")
    .eq("user_id", userId);
  return new Set((data ?? []).map((c) => c.normalized_name).filter((n): n is string => !!n));
}

export async function getCompanies(supabase: DB, userId: string): Promise<Tables<"companies">[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getOutreachEmails(
  supabase: DB,
  userId: string
): Promise<Tables<"outreach_emails">[]> {
  const { data, error } = await supabase
    .from("outreach_emails")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}
