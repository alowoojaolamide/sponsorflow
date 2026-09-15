"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, MapPin, ExternalLink } from "lucide-react";

type RecentJob = {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  url: string | null;
  discovered_at: string;
};

export function RecentJobsList() {
  const [jobs, setJobs] = useState<RecentJob[] | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setJobs(d?.recent_jobs ?? []))
      .catch(() => {});
  }, []);

  return (
    <Card className="p-6 h-full flex flex-col">
      <CardHeader className="px-0 pt-0 flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600" /> Recently Discovered Roles
        </CardTitle>
        <Link href="/jobs" className="text-xs text-primary underline underline-offset-4 whitespace-nowrap">
          See all →
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-1">
        {!jobs ? (
          <p className="text-sm text-shade-50 py-8 text-center">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-shade-50 py-8 text-center">
            No roles discovered yet. Go to{" "}
            <Link href="/companies" className="text-primary underline">
              Companies
            </Link>{" "}
            and click &quot;Discover Jobs for All&quot;.
          </p>
        ) : (
          <div>
            {jobs.map((j) => (
              <div key={j.id} className="py-2.5 border-b border-hairline-light last:border-0">
                <p className="text-sm font-medium text-ink truncate">
                  {j.title} — {j.company_name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-shade-50">
                  {j.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {j.location}
                    </span>
                  )}
                  <span>{new Date(j.discovered_at).toLocaleDateString()}</span>
                  {j.url && (
                    <a
                      href={j.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
