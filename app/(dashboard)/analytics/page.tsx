"use client";

import React, { useEffect, useState } from "react";
import { DashboardStats, type DashboardStatsSummary } from "@/components/dashboard/DashboardStats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

type IndustryStats = {
  industry: string;
  companies: number;
  sent: number;
  replies: number;
  reply_rate: number;
};

type Summary = DashboardStatsSummary & {
  pipeline: {
    targeted: number;
    drafted: number;
    dispatched: number;
    positive_conversations: number;
    interviews: number;
  };
  by_industry: IndustryStats[];
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => {});
  }, []);

  const pipeline = summary?.pipeline;
  const industries = summary?.by_industry ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Outreach Analytics & Pipeline</h1>
        <p className="text-sm text-shade-50">
          Monitor open rates, link clicks, reply sentiment, and interview conversions by industry.
        </p>
      </div>

      <DashboardStats summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> Performance by Industry
            </CardTitle>
          </CardHeader>
          <CardContent>
            {industries.length === 0 ? (
              <p className="text-sm text-shade-50 text-center py-8">
                No companies yet. Import some to see industry breakdowns here.
              </p>
            ) : (
              <div className="space-y-4">
                {industries.map((ind) => (
                  <div key={ind.industry} className="p-3 bg-canvas-cream rounded-md border border-hairline-light">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-ink capitalize">{ind.industry}</span>
                      <span className="text-xs text-shade-40">{ind.companies} companies</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-shade-50">
                      <span>Sent: {ind.sent}</span>
                      <span>Replies: {ind.replies}</span>
                      <span className="font-semibold text-ink">Reply Rate: {ind.reply_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-hairline-light">
              <span className="text-shade-60">1. Target Companies Curated</span>
              <span className="font-bold text-ink">{pipeline?.targeted ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-hairline-light">
              <span className="text-shade-60">2. Personalized Drafts Prepared</span>
              <span className="font-bold text-ink">{pipeline?.drafted ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-hairline-light">
              <span className="text-shade-60">3. Emails Approved & Dispatched</span>
              <span className="font-bold text-ink">{pipeline?.dispatched ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-hairline-light">
              <span className="text-shade-60">4. Positive Conversations Active</span>
              <span className="font-bold text-ink">{pipeline?.positive_conversations ?? "—"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-shade-60">5. Interviews Scheduled</span>
              <span className="font-bold text-emerald-600">{pipeline?.interviews ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
