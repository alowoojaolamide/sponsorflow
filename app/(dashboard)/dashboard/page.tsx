"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardStats, type DashboardStatsSummary } from "@/components/dashboard/DashboardStats";
import { VolumeStats, type VolumeStatsSummary } from "@/components/dashboard/VolumeStats";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { IndustryBreakdownChart } from "@/components/dashboard/IndustryBreakdownChart";
import { RecentJobsList } from "@/components/dashboard/RecentJobsList";
import { RecentDraftsList } from "@/components/dashboard/RecentDraftsList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileSummary = {
  profile: { profile_complete_percent: number; onboarding_complete: boolean } | null;
};

type FullSummary = DashboardStatsSummary &
  VolumeStatsSummary & {
    by_industry: { industry: string; companies: number }[];
    daily_activity: { date: string; emails_sent: number; jobs_discovered: number }[];
    recent_jobs: { id: string; title: string; company_name: string; location: string | null; url: string | null; discovered_at: string }[];
    recent_drafts: { id: string; subject: string; company_name: string; status: string; created_at: string }[];
  };

export default function DashboardHomePage() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<FullSummary | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((res) => res.json()).then(setProfile);
    fetch("/api/companies").then((res) => res.json()).then((d) => setCompanyCount(d.total ?? 0));
    // Fetched once here and passed down to every widget below instead of
    // each of the 6 independently calling /api/analytics on its own.
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Welcome back!</h1>
        <p className="text-sm text-shade-50">Here&apos;s where your outreach pipeline stands today.</p>
      </div>

      {profile?.profile && !profile.profile.onboarding_complete && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Your profile is {profile.profile.profile_complete_percent}% complete. Finish onboarding to
              unlock personalized email generation.
            </p>
            <Link href="/onboarding/step-1">
              <Button variant="primary" size="sm">Complete your profile →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {companyCount === 0 && (
        <Card className="border-hairline-light">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-shade-60">No companies imported yet.</p>
            <Link href="/companies/import">
              <Button variant="outline-light" size="sm">Import companies</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <VolumeStats summary={summary} />
      <DashboardStats summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* `summary ? summary.X : null` (not `summary?.X`, which would be
              `undefined` while still loading) — these components treat
              `undefined` as "no prop passed, fetch your own copy" and
              anything else, including `null`, as "shared data is coming
              from the parent, wait for it" so they don't each fire their
              own /api/analytics call during the initial loading window. */}
          <ActivityChart data={summary ? summary.daily_activity : null} />
        </div>
        <IndustryBreakdownChart industries={summary ? summary.by_industry : null} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentJobsList jobs={summary ? summary.recent_jobs : null} />
        <RecentDraftsList drafts={summary ? summary.recent_drafts : null} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/companies"><Button variant="outline-light" size="sm">Companies</Button></Link>
        <Link href="/emails"><Button variant="outline-light" size="sm">Generate Emails</Button></Link>
        <Link href="/emails/pending"><Button variant="outline-light" size="sm">Pending Approvals</Button></Link>
        <Link href="/analytics"><Button variant="outline-light" size="sm">Full Analytics</Button></Link>
      </div>
    </div>
  );
}
