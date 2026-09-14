"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin } from "lucide-react";

type JobPosting = {
  id: string;
  company_id: string;
  source: string;
  title: string;
  url: string | null;
  location: string | null;
  status: string;
  discovered_at: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [jobsRes, companiesRes] = await Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/companies?limit=2000").then((r) => r.json()),
    ]);
    setJobs((jobsRes.jobs ?? []).filter((j: JobPosting) => j.status !== "dismissed"));
    setCompanyNames(
      Object.fromEntries(
        (companiesRes.companies ?? []).map((c: { id: string; company_name: string }) => [c.id, c.company_name])
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function dismiss(id: string) {
    await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setJobs((js) => js.filter((j) => j.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Open Roles ({jobs.length})</h1>
        <p className="text-sm text-shade-50">
          Design-relevant openings found at your sponsor companies. Click &quot;Find Roles&quot; on a company to scan it.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-shade-50">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-shade-50">
            No open roles yet. Go to <Link href="/companies" className="text-primary underline">Companies</Link> and
            click &quot;Find Roles&quot; on a company to scan its careers page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink text-sm">
                    {job.title} — {companyNames[job.company_id] ?? "Unknown company"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-shade-50">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                    )}
                    <span className="capitalize">via {job.source.replace("_", " ")}</span>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        View posting <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => dismiss(job.id)}>
                    Dismiss
                  </Button>
                  <Link
                    href={`/emails?company_id=${job.company_id}&job_title=${encodeURIComponent(job.title)}${
                      job.url ? `&job_url=${encodeURIComponent(job.url)}` : ""
                    }`}
                  >
                    <Button variant="primary" size="sm" className="text-xs">
                      Pitch This Role
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
