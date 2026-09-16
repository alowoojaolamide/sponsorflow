"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Award } from "lucide-react";
import { GmailConnectionCard } from "@/components/dashboard/GmailConnectionCard";
import { ResumeCard } from "@/components/dashboard/ResumeCard";

type ProfileData = {
  profile: {
    professional_summary: string | null;
    target_job_title: string | null;
    location: string | null;
    target_salary_gbp: number | null;
    requires_sponsorship: boolean;
    onboarding_complete: boolean;
    profile_complete_percent: number;
  } | null;
  industries: { industry: string; years_experience: number | null }[];
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const profile = data?.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Personalization Profile</h1>
          <p className="text-sm text-shade-50">
            Your verified experience and positioning angles used to personalize every outreach email.
          </p>
          {profile && (
            <p className="text-xs text-shade-40 mt-1">
              Profile: {profile.profile_complete_percent}% complete
              {profile.onboarding_complete && " ✓"}
            </p>
          )}
        </div>
        <Link href={profile?.onboarding_complete ? "/onboarding/step-10" : "/onboarding/step-1"}>
          <Button variant="primary" size="sm">
            {profile?.onboarding_complete ? "Edit Profile" : "Complete your profile →"}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" /> Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-shade-60">
            <p>{profile?.professional_summary || "Complete onboarding to add your professional summary."}</p>
            {data && data.industries.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {data.industries.map((i) => (
                  <span key={i.industry} className="px-2.5 py-1 rounded-pill bg-aloe-10 text-on-aloe text-xs font-medium capitalize">
                    {i.industry} {i.years_experience ? `(${i.years_experience} yrs)` : ""}
                  </span>
                ))}
                {profile?.requires_sponsorship && (
                  <span className="px-2.5 py-1 rounded-pill bg-hairline-light text-ink text-xs font-medium">
                    UK Visa Sponsorship Required
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> Target Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-shade-40 uppercase font-semibold">Target Title</span>
              <p className="font-semibold text-ink">{profile?.target_job_title || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-shade-40 uppercase font-semibold">Location Target</span>
              <p className="font-medium text-ink">{profile?.location || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-shade-40 uppercase font-semibold">Salary Expectation</span>
              <p className="font-medium text-ink">
                {profile?.target_salary_gbp ? `£${profile.target_salary_gbp.toLocaleString()} GBP` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={null}>
          <GmailConnectionCard />
        </Suspense>
        <ResumeCard />
      </div>
    </div>
  );
}
