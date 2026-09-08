"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileSummary = {
  profile: { profile_complete_percent: number; onboarding_complete: boolean } | null;
};

export default function DashboardHomePage() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [companyCount, setCompanyCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/profile").then((res) => res.json()).then(setProfile);
    fetch("/api/companies").then((res) => res.json()).then((d) => setCompanyCount(d.total ?? 0));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Welcome back!</h1>
        <p className="text-sm text-shade-50">Here&apos;s where your outreach pipeline stands today.</p>
      </div>

      {profile?.profile && !profile.profile.onboarding_complete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-center justify-between">
            <p className="text-sm text-amber-800">
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

      <DashboardStats />

      <div className="flex gap-3">
        <Link href="/companies"><Button variant="outline-light" size="sm">Companies</Button></Link>
        <Link href="/emails"><Button variant="outline-light" size="sm">Generate Emails</Button></Link>
        <Link href="/emails/pending"><Button variant="outline-light" size="sm">Pending Approvals</Button></Link>
        <Link href="/analytics"><Button variant="outline-light" size="sm">Full Analytics</Button></Link>
      </div>
    </div>
  );
}
