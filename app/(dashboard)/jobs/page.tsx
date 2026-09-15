"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { runWithConcurrency } from "@/lib/utils";
import { ExternalLink, MapPin, Sparkles, X } from "lucide-react";

type JobPosting = {
  id: string;
  company_id: string;
  source: string;
  title: string;
  url: string | null;
  location: string | null;
  description: string | null;
  status: string;
  discovered_at: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchDone, setBatchDone] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchDrafted, setBatchDrafted] = useState(0);
  const [batchErrors, setBatchErrors] = useState(0);
  const [batchSkippedNoEmail, setBatchSkippedNoEmail] = useState(0);
  const [batchLastError, setBatchLastError] = useState<string | null>(null);
  const batchCancelRef = React.useRef(false);

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

  async function draftOne(job: JobPosting) {
    const draftRes = await fetch("/api/emails/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: job.company_id,
        job_title: job.title,
        job_url: job.url,
        job_description: job.description,
      }),
    });
    const draftData = await draftRes.json();
    if (!draftRes.ok) throw new Error(draftData.error || "Failed to generate draft");
    if (!draftData.to_email) {
      throw new Error("NO_RECIPIENT_EMAIL");
    }

    const saveRes = await fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: draftData.company_id,
        contact_id: draftData.contact_id,
        to_email: draftData.to_email,
        to_name: draftData.to_name,
        subject: draftData.subject,
        body: draftData.body,
        positioning_angle: draftData.positioning_angle,
        confidence: draftData.confidence,
        job_title: draftData.job_title,
        job_url: draftData.job_url,
      }),
    });
    const saveData = await saveRes.json();
    if (!saveRes.ok) throw new Error(saveData.error || "Failed to save draft");

    await fetch(`/api/jobs/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pitched" }),
    });
  }

  async function handleBatchDraft() {
    const targets = jobs.filter((j) => j.status === "new");
    setBatchRunning(true);
    batchCancelRef.current = false;
    setBatchDone(0);
    setBatchDrafted(0);
    setBatchErrors(0);
    setBatchSkippedNoEmail(0);
    setBatchLastError(null);
    setBatchTotal(targets.length);

    try {
      await runWithConcurrency(
        targets,
        3,
        (job) => draftOne(job),
        (job, _index, _result, error) => {
          setBatchDone((d) => d + 1);
          if (error instanceof Error && error.message === "NO_RECIPIENT_EMAIL") {
            setBatchSkippedNoEmail((n) => n + 1);
          } else if (error) {
            setBatchErrors((e) => e + 1);
            setBatchLastError(error instanceof Error ? error.message : "Failed to draft");
          } else {
            setBatchDrafted((n) => n + 1);
            setJobs((js) => js.map((j) => (j.id === job.id ? { ...j, status: "pitched" } : j)));
          }
        },
        () => batchCancelRef.current
      );
    } finally {
      setBatchRunning(false);
    }
  }

  const newCount = jobs.filter((j) => j.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Open Roles ({jobs.length})</h1>
          <p className="text-sm text-shade-50">
            Design-relevant openings found at your sponsor companies. Click &quot;Find Roles&quot; on a company to scan it.
          </p>
        </div>
        {newCount > 0 && (
          <Button
            variant="outline-light"
            size="sm"
            className="gap-2 shrink-0"
            disabled={batchRunning}
            onClick={handleBatchDraft}
          >
            <Sparkles className={`w-4 h-4 ${batchRunning ? "animate-pulse" : ""}`} />
            {batchRunning ? "Drafting..." : `Draft Emails for All New Roles (${newCount})`}
          </Button>
        )}
      </div>

      {(batchRunning || batchTotal > 0) && (
        <Card className="border-primary/30">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink flex items-center gap-2">
                <Sparkles className={`w-4 h-4 text-primary ${batchRunning ? "animate-pulse" : ""}`} />
                {batchRunning
                  ? `Generating drafts... (${batchDone}/${batchTotal})`
                  : `Done — ${batchDone}/${batchTotal} roles processed`}
              </span>
              {batchRunning ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                  onClick={() => {
                    batchCancelRef.current = true;
                  }}
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              ) : (
                <button type="button" className="text-xs text-shade-50 hover:text-ink" onClick={() => setBatchTotal(0)}>
                  Dismiss
                </button>
              )}
            </div>
            <div className="w-full h-1.5 rounded-pill bg-hairline-light overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${batchTotal ? (batchDone / batchTotal) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-shade-50">
              {batchDrafted} draft{batchDrafted === 1 ? "" : "s"} created
              {batchSkippedNoEmail > 0 &&
                ` · ${batchSkippedNoEmail} skipped (no recipient email on file — add one via "Pitch This Role")`}
              {batchErrors > 0 && ` · ${batchErrors} failed${batchLastError ? ` (${batchLastError})` : ""}`}
              {!batchRunning && batchDrafted > 0 && (
                <>
                  {" — "}
                  <Link href="/emails/pending" className="text-primary underline underline-offset-4">
                    review drafts →
                  </Link>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

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
                  <p className="font-medium text-ink text-sm flex items-center gap-2">
                    {job.title} — {companyNames[job.company_id] ?? "Unknown company"}
                    {job.status === "pitched" && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-aloe-10 text-on-aloe shrink-0">
                        Drafted
                      </span>
                    )}
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
                    <Button variant={job.status === "pitched" ? "outline-light" : "primary"} size="sm" className="text-xs">
                      {job.status === "pitched" ? "Draft Again" : "Pitch This Role"}
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
