import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

export type IndustryStats = {
  industry: string;
  companies: number;
  sent: number;
  replies: number;
  reply_rate: number;
  positive_replies: number;
  interviews: number;
};

export type DailyActivity = {
  date: string; // YYYY-MM-DD
  emails_sent: number;
  jobs_discovered: number;
};

export type RecentJob = {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  url: string | null;
  discovered_at: string;
};

export type RecentDraft = {
  id: string;
  subject: string;
  company_name: string;
  status: string;
  created_at: string;
};

export type DashboardSummary = {
  emails_sent_today: number;
  daily_limit: number;
  open_rate: number;
  reply_rate: number;
  interviews_scheduled: number;
  companies_total: number;
  jobs_discovered_total: number;
  companies_scanned: number;
  companies_researched: number;
  pipeline: {
    targeted: number;
    drafted: number;
    dispatched: number;
    positive_conversations: number;
    interviews: number;
  };
  by_industry: IndustryStats[];
  by_status: Record<string, number>;
  daily_activity: DailyActivity[];
  recent_jobs: RecentJob[];
  recent_drafts: RecentDraft[];
};

const DAILY_ACTIVITY_DAYS = 14;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function getDashboardSummary(supabase: DB, userId: string): Promise<DashboardSummary> {
  const cutoff = new Date(Date.now() - DAILY_ACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: limits },
    { data: emails },
    { data: replies },
    { data: companies },
    { count: jobsTotal },
    { data: recentJobPostings },
    { data: recentJobsRaw },
    { data: recentDraftsRaw },
  ] = await Promise.all([
    supabase.from("send_limits").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("outreach_emails")
      .select("id, company_id, status, sent_at, opened_at")
      .eq("user_id", userId),
    supabase.from("email_replies").select("id, outreach_email_id, ai_classification").eq("user_id", userId),
    supabase
      .from("companies")
      .select("id, industry, status, jobs_scanned_at, researched_at, website")
      .eq("user_id", userId),
    supabase.from("job_postings").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("job_postings")
      .select("id, discovered_at")
      .eq("user_id", userId)
      .gte("discovered_at", cutoff),
    supabase
      .from("job_postings")
      .select("id, title, location, url, discovered_at, companies(company_name)")
      .eq("user_id", userId)
      .order("discovered_at", { ascending: false })
      .limit(5),
    supabase
      .from("outreach_emails")
      .select("id, subject, status, created_at, companies(company_name)")
      .eq("user_id", userId)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const allEmails = emails ?? [];
  const allReplies = replies ?? [];
  const allCompanies = companies ?? [];

  const sentEmails = allEmails.filter((e) => e.sent_at);
  const opened = sentEmails.filter((e) => e.opened_at).length;
  const totalSent = sentEmails.length;

  const positiveReplies = allReplies.filter(
    (r) => r.ai_classification === "positive" || r.ai_classification === "interested"
  ).length;
  const interviews = allCompanies.filter((c) => c.status === "interview").length;
  const companiesScanned = allCompanies.filter((c) => c.jobs_scanned_at).length;
  const companiesResearched = allCompanies.filter((c) => c.researched_at).length;

  const emailsByCompany = new Map<string, number>();
  for (const e of sentEmails) {
    emailsByCompany.set(e.company_id, (emailsByCompany.get(e.company_id) ?? 0) + 1);
  }
  const repliesByCompany = new Map<string, number>();
  const emailToCompany = new Map(allEmails.map((e) => [e.id, e.company_id]));
  for (const r of allReplies) {
    const companyId = emailToCompany.get(r.outreach_email_id ?? "");
    if (!companyId) continue;
    repliesByCompany.set(companyId, (repliesByCompany.get(companyId) ?? 0) + 1);
  }

  const industryMap = new Map<string, IndustryStats>();
  for (const c of allCompanies) {
    const industry = c.industry ?? "Uncategorized";
    const entry = industryMap.get(industry) ?? {
      industry,
      companies: 0,
      sent: 0,
      replies: 0,
      reply_rate: 0,
      positive_replies: 0,
      interviews: 0,
    };
    entry.companies += 1;
    entry.sent += emailsByCompany.get(c.id) ?? 0;
    entry.replies += repliesByCompany.get(c.id) ?? 0;
    if (c.status === "interview") entry.interviews += 1;
    industryMap.set(industry, entry);
  }
  Array.from(industryMap.values()).forEach((entry) => {
    entry.reply_rate = entry.sent > 0 ? Math.round((entry.replies / entry.sent) * 100) : 0;
  });

  const by_status: Record<string, number> = {};
  for (const c of allCompanies) {
    by_status[c.status] = (by_status[c.status] ?? 0) + 1;
  }

  // Build a fixed 14-day date axis (oldest -> newest) so the chart has no gaps.
  const dailyMap = new Map<string, DailyActivity>();
  for (let i = DAILY_ACTIVITY_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, emails_sent: 0, jobs_discovered: 0 });
  }
  for (const e of sentEmails) {
    if (!e.sent_at) continue;
    const key = dayKey(e.sent_at);
    const entry = dailyMap.get(key);
    if (entry) entry.emails_sent += 1;
  }
  for (const j of recentJobPostings ?? []) {
    const key = dayKey(j.discovered_at);
    const entry = dailyMap.get(key);
    if (entry) entry.jobs_discovered += 1;
  }

  const recent_jobs: RecentJob[] = (recentJobsRaw ?? []).map((j) => {
    const company = j.companies as unknown as { company_name: string } | { company_name: string }[] | null;
    const company_name = Array.isArray(company) ? company[0]?.company_name : company?.company_name;
    return {
      id: j.id,
      title: j.title,
      company_name: company_name ?? "Unknown company",
      location: j.location,
      url: j.url,
      discovered_at: j.discovered_at,
    };
  });

  const recent_drafts: RecentDraft[] = (recentDraftsRaw ?? []).map((e) => {
    const company = e.companies as unknown as { company_name: string } | { company_name: string }[] | null;
    const company_name = Array.isArray(company) ? company[0]?.company_name : company?.company_name;
    return {
      id: e.id,
      subject: e.subject,
      company_name: company_name ?? "Unknown company",
      status: e.status ?? "draft",
      created_at: e.created_at,
    };
  });

  return {
    emails_sent_today: limits?.emails_sent_today ?? 0,
    daily_limit: limits?.daily_limit ?? 20,
    open_rate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
    reply_rate: totalSent > 0 ? Math.round((allReplies.length / totalSent) * 100) : 0,
    interviews_scheduled: interviews,
    companies_total: allCompanies.length,
    jobs_discovered_total: jobsTotal ?? 0,
    companies_scanned: companiesScanned,
    companies_researched: companiesResearched,
    pipeline: {
      targeted: allCompanies.length,
      drafted: allEmails.length,
      dispatched: totalSent,
      positive_conversations: positiveReplies,
      interviews,
    },
    by_industry: Array.from(industryMap.values()).sort((a, b) => b.companies - a.companies),
    by_status,
    daily_activity: Array.from(dailyMap.values()),
    recent_jobs,
    recent_drafts,
  };
}
