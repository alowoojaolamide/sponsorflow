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

export type DashboardSummary = {
  emails_sent_today: number;
  daily_limit: number;
  open_rate: number;
  reply_rate: number;
  interviews_scheduled: number;
  pipeline: {
    targeted: number;
    drafted: number;
    dispatched: number;
    positive_conversations: number;
    interviews: number;
  };
  by_industry: IndustryStats[];
  by_status: Record<string, number>;
};

export async function getDashboardSummary(supabase: DB, userId: string): Promise<DashboardSummary> {
  const [{ data: limits }, { data: emails }, { data: replies }, { data: companies }] = await Promise.all([
    supabase.from("send_limits").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("outreach_emails")
      .select("id, company_id, status, sent_at, opened_at")
      .eq("user_id", userId),
    supabase.from("email_replies").select("id, outreach_email_id, ai_classification").eq("user_id", userId),
    supabase.from("companies").select("id, industry, status").eq("user_id", userId),
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

  return {
    emails_sent_today: limits?.emails_sent_today ?? 0,
    daily_limit: limits?.daily_limit ?? 20,
    open_rate: totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0,
    reply_rate: totalSent > 0 ? Math.round((allReplies.length / totalSent) * 100) : 0,
    interviews_scheduled: interviews,
    pipeline: {
      targeted: allCompanies.length,
      drafted: allEmails.length,
      dispatched: totalSent,
      positive_conversations: positiveReplies,
      interviews,
    },
    by_industry: Array.from(industryMap.values()).sort((a, b) => b.companies - a.companies),
    by_status,
  };
}
