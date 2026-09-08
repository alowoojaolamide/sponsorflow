import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, FileText, Briefcase, Award } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Personalization Profile</h1>
          <p className="text-sm text-shade-50">
            Your verified experience and positioning angles used to personalize every outreach email.
          </p>
        </div>
        <Link href="/onboarding/step-1">
          <Button variant="primary" size="sm">
            Edit 10-Step Profile
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
            <p>
              Product Designer with 4+ years of experience leading UX/UI across high-growth Fintech and SaaS environments. Proven track record reducing complex workflow friction by 40% and translating business requirements into intuitive consumer and enterprise experiences.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-pill bg-aloe-10 text-ink text-xs font-medium">Fintech (4 yrs)</span>
              <span className="px-2.5 py-1 rounded-pill bg-pistachio-10 text-ink text-xs font-medium">SaaS (2 yrs)</span>
              <span className="px-2.5 py-1 rounded-pill bg-slate-100 text-ink text-xs font-medium">UK Visa Sponsorship Required</span>
            </div>
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
              <p className="font-semibold text-ink">Senior Product / UX Designer</p>
            </div>
            <div>
              <span className="text-xs text-shade-40 uppercase font-semibold">Location Target</span>
              <p className="font-medium text-ink">London (Hybrid / Remote)</p>
            </div>
            <div>
              <span className="text-xs text-shade-40 uppercase font-semibold">Salary Expectation</span>
              <p className="font-medium text-ink">£65,000 - £85,000 GBP</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
