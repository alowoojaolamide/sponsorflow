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

/**
 * Like getExistingNormalizedNames, but scoped to a specific set of candidate
 * names via .in(). Used for batched imports so each batch's dedup check
 * stays cheap regardless of how large the user's total company list gets,
 * instead of re-fetching every existing name on every batch.
 *
 * .in() filters are sent as GET query params, so a single call is chunked
 * to a safe URL length — a 1000-name .in() list can exceed common proxy
 * URL-length limits, which silently drops/errors the query rather than
 * failing loudly.
 */
const IN_FILTER_CHUNK_SIZE = 150;

export async function getExistingNormalizedNamesAmong(
  supabase: DB,
  userId: string,
  candidates: string[]
): Promise<Set<string>> {
  if (candidates.length === 0) return new Set();

  const unique = Array.from(new Set(candidates));
  const result = new Set<string>();

  for (let i = 0; i < unique.length; i += IN_FILTER_CHUNK_SIZE) {
    const chunk = unique.slice(i, i + IN_FILTER_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("companies")
      .select("normalized_name")
      .eq("user_id", userId)
      .in("normalized_name", chunk);

    if (error) {
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
    for (const row of data ?? []) {
      if (row.normalized_name) result.add(row.normalized_name);
    }
  }

  return result;
}

const SORTABLE_COLUMNS = ["company_name", "industry", "status", "created_at"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

export function isSortableColumn(value: string): value is SortableColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

export async function getCompanies(
  supabase: DB,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    industry?: string;
    sort?: SortableColumn;
    order?: "asc" | "desc";
    scanned?: boolean;
    researched?: boolean;
    hasWebsite?: boolean;
  } = {}
): Promise<{ companies: Tables<"companies">[]; total: number }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const sort = options.sort && isSortableColumn(options.sort) ? options.sort : "created_at";
  const ascending = options.order === "asc";

  let query = supabase.from("companies").select("*", { count: "exact" }).eq("user_id", userId);

  if (options.search) {
    query = query.ilike("company_name", `%${options.search}%`);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.industry) {
    query = query.eq("industry", options.industry);
  }
  if (options.scanned === false) {
    query = query.is("jobs_scanned_at", null);
  } else if (options.scanned === true) {
    query = query.not("jobs_scanned_at", "is", null);
  }
  if (options.researched === false) {
    query = query.is("researched_at", null);
  } else if (options.researched === true) {
    query = query.not("researched_at", "is", null);
  }
  if (options.hasWebsite === false) {
    query = query.is("website", null);
  } else if (options.hasWebsite === true) {
    query = query.not("website", "is", null);
  }

  const { data, error, count } = await query
    .order(sort, { ascending, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) return { companies: [], total: 0 };
  return { companies: data || [], total: count ?? 0 };
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
