"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { runWithConcurrency } from "@/lib/utils";
import {
  Upload,
  Building2,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Radar,
  X,
  CheckCircle2,
  Globe,
} from "lucide-react";

type Company = {
  id: string;
  company_name: string;
  website: string | null;
  career_page: string | null;
  industry: string | null;
  personalization_hook: string | null;
  status: string;
  jobs_scanned_at: string | null;
  researched_at: string | null;
};

// Companies API caps `limit` at 2000 per request server-side, so scanning
// the full list (100k+ for large imports) means paging through it.
const FETCH_PAGE_SIZE = 2000;

type SortColumn = "company_name" | "industry" | "status";

const PAGE_SIZE = 50;
const STATUS_OPTIONS = ["new", "contacted", "replied", "interview", "offer", "rejected"];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Record<string, string>>({});
  const [researchingRow, setResearchingRow] = useState<string | null>(null);
  const [researchRowResult, setResearchRowResult] = useState<Record<string, string>>({});

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchFetchingTargets, setBatchFetchingTargets] = useState(false);
  const [batchDone, setBatchDone] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchJobsFound, setBatchJobsFound] = useState(0);
  const [batchErrors, setBatchErrors] = useState(0);
  const [rescanAll, setRescanAll] = useState(false);
  const [unscannedCount, setUnscannedCount] = useState<number | null>(null);
  const batchCancelRef = React.useRef(false);

  const [researchRunning, setResearchRunning] = useState(false);
  const [researchFetchingTargets, setResearchFetchingTargets] = useState(false);
  const [researchDone, setResearchDone] = useState(0);
  const [researchTotal, setResearchTotal] = useState(0);
  const [researchFoundCount, setResearchFoundCount] = useState(0);
  const [researchErrors, setResearchErrors] = useState(0);
  const [reresearchAll, setReresearchAll] = useState(false);
  const [unresearchedCount, setUnresearchedCount] = useState<number | null>(null);
  const [researchStoppedReason, setResearchStoppedReason] = useState<string | null>(null);
  const researchCancelRef = React.useRef(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<"" | "yes" | "no">("");
  const [likelyTechFilter, setLikelyTechFilter] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("company_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      sort: sortColumn,
      order: sortOrder,
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (websiteFilter) params.set("has_website", websiteFilter === "yes" ? "true" : "false");
    if (likelyTechFilter) params.set("likely_tech", "true");

    fetch(`/api/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, websiteFilter, likelyTechFilter, sortColumn, sortOrder]);

  // Drives the "Discover Jobs for All" button's remaining-count hint —
  // refetched whenever the filters or the batch scan's progress change.
  useEffect(() => {
    const params = new URLSearchParams({ limit: "1", scanned: "false" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (likelyTechFilter) params.set("likely_tech", "true");
    fetch(`/api/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setUnscannedCount(data.total ?? 0))
      .catch(() => setUnscannedCount(null));
  }, [search, statusFilter, likelyTechFilter, batchRunning]);

  // Same, for the "Research Companies" button — only companies missing a
  // website need this at all.
  useEffect(() => {
    const params = new URLSearchParams({ limit: "1", has_website: "false", researched: "false" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (likelyTechFilter) params.set("likely_tech", "true");
    fetch(`/api/companies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setUnresearchedCount(data.total ?? 0))
      .catch(() => setUnresearchedCount(null));
  }, [search, statusFilter, likelyTechFilter, researchRunning]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setPage(0);
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 text-shade-30" />;
    return sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  }

  async function handleFindRoles(companyId: string) {
    setScanning(companyId);
    setScanResult((r) => ({ ...r, [companyId]: "" }));
    try {
      const res = await fetch("/api/jobs/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setScanResult((r) => ({
        ...r,
        [companyId]:
          data.found > 0
            ? `${data.found} role${data.found === 1 ? "" : "s"} found`
            : data.no_career_page
            ? "No career page on file"
            : "No matching roles found",
      }));
      const scannedAt = new Date().toISOString();
      setCompanies((cs) => cs.map((c) => (c.id === companyId ? { ...c, jobs_scanned_at: scannedAt } : c)));
    } catch (err: unknown) {
      setScanResult((r) => ({ ...r, [companyId]: err instanceof Error ? err.message : "Scan failed" }));
    } finally {
      setScanning(null);
    }
  }

  // Fetches every company matching the current filters plus `extraParams`
  // (paginating past the API's 2000-per-request cap) so a batch action
  // covers a full 100k+ list, not just the first page.
  async function fetchAllTargets(extraParams: Record<string, string>, isCancelled: () => boolean): Promise<Company[]> {
    const all: Company[] = [];
    let offset = 0;
    for (;;) {
      const params = new URLSearchParams({ limit: String(FETCH_PAGE_SIZE), offset: String(offset), ...extraParams });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (likelyTechFilter) params.set("likely_tech", "true");
      const res = await fetch(`/api/companies?${params.toString()}`);
      const data = await res.json();
      const batch: Company[] = data.companies ?? [];
      all.push(...batch);
      if (isCancelled() || batch.length < FETCH_PAGE_SIZE) break;
      offset += FETCH_PAGE_SIZE;
    }
    return all;
  }

  async function handleBatchDiscover() {
    setBatchRunning(true);
    setBatchFetchingTargets(true);
    batchCancelRef.current = false;
    setBatchDone(0);
    setBatchJobsFound(0);
    setBatchErrors(0);
    setBatchTotal(0);

    try {
      const targets = await fetchAllTargets(rescanAll ? {} : { scanned: "false" }, () => batchCancelRef.current);
      setBatchFetchingTargets(false);
      setBatchTotal(targets.length);

      await runWithConcurrency(
        targets,
        4,
        (company) =>
          fetch("/api/jobs/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company_id: company.id }),
          }).then((r) => r.json()),
        (company, _index, result, error) => {
          setBatchDone((d) => d + 1);
          if (error || result?.error) {
            setBatchErrors((e) => e + 1);
          } else {
            setBatchJobsFound((n) => n + (result?.found ?? 0));
            const scannedAt = new Date().toISOString();
            setCompanies((cs) => cs.map((c) => (c.id === company.id ? { ...c, jobs_scanned_at: scannedAt } : c)));
          }
        },
        () => batchCancelRef.current
      );
    } finally {
      setBatchFetchingTargets(false);
      setBatchRunning(false);
    }
  }

  async function handleResearchOne(companyId: string) {
    const res = await fetch(`/api/companies/${companyId}/research`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || "Research failed") as Error & { code?: string };
      err.code = data.code;
      throw err;
    }
    if (data.company) {
      setCompanies((cs) => cs.map((c) => (c.id === companyId ? { ...c, ...data.company } : c)));
    }
    return data;
  }

  async function handleResearchRow(companyId: string) {
    setResearchingRow(companyId);
    setResearchRowResult((r) => ({ ...r, [companyId]: "" }));
    try {
      const data = await handleResearchOne(companyId);
      setResearchRowResult((r) => ({
        ...r,
        [companyId]: data.found ? "Website found" : "Couldn't confidently identify a website",
      }));
    } catch (err: unknown) {
      setResearchRowResult((r) => ({ ...r, [companyId]: err instanceof Error ? err.message : "Research failed" }));
    } finally {
      setResearchingRow(null);
    }
  }

  async function handleBatchResearch() {
    setResearchRunning(true);
    setResearchFetchingTargets(true);
    researchCancelRef.current = false;
    setResearchDone(0);
    setResearchFoundCount(0);
    setResearchErrors(0);
    setResearchTotal(0);
    setResearchStoppedReason(null);

    try {
      const extraParams: Record<string, string> = { has_website: "false" };
      if (!reresearchAll) extraParams.researched = "false";
      const targets = await fetchAllTargets(extraParams, () => researchCancelRef.current);
      setResearchFetchingTargets(false);
      setResearchTotal(targets.length);

      await runWithConcurrency(
        targets,
        4,
        (company) => handleResearchOne(company.id),
        (_company, _index, result, error) => {
          setResearchDone((d) => d + 1);
          const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
          if (code === "ai_cap_reached") {
            researchCancelRef.current = true;
            setResearchStoppedReason(error instanceof Error ? error.message : "AI usage cap reached.");
          } else if (error) {
            setResearchErrors((e) => e + 1);
          } else if (result?.found) {
            setResearchFoundCount((n) => n + 1);
          }
        },
        () => researchCancelRef.current
      );
    } finally {
      setResearchFetchingTargets(false);
      setResearchRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Target UK Tech Sponsors</h1>
          <p className="text-sm text-shade-50">
            Import your company list via CSV with automatic deduplication, or add companies one at a time.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline-light"
              size="sm"
              className="gap-2"
              disabled={researchRunning || total === 0 || (unresearchedCount === 0 && !reresearchAll)}
              onClick={handleBatchResearch}
            >
              <Globe className={`w-4 h-4 ${researchRunning ? "animate-pulse" : ""}`} />
              {researchRunning
                ? researchFetchingTargets
                  ? "Finding companies to research..."
                  : "Researching..."
                : reresearchAll
                ? "Re-research All"
                : unresearchedCount != null
                ? `Research Companies (${unresearchedCount.toLocaleString()} left)`
                : "Research Companies"}
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              className="gap-2"
              disabled={batchRunning || total === 0 || (unscannedCount === 0 && !rescanAll)}
              onClick={handleBatchDiscover}
            >
              <Radar className={`w-4 h-4 ${batchRunning ? "animate-pulse" : ""}`} />
              {batchRunning
                ? batchFetchingTargets
                  ? "Finding companies to scan..."
                  : "Scanning..."
                : rescanAll
                ? "Re-scan All Jobs"
                : unscannedCount != null
                ? `Discover Jobs for All (${unscannedCount.toLocaleString()} left)`
                : "Discover Jobs for All"}
            </Button>
            <Link href="/jobs">
              <Button variant="outline-light" size="sm" className="gap-2">
                <Search className="w-4 h-4" /> Open Roles
              </Button>
            </Link>
            <Link href="/companies/import">
              <Button variant="outline-light" size="sm" className="gap-2">
                <Upload className="w-4 h-4" /> Import CSV
              </Button>
            </Link>
          </div>
          <div className="flex gap-4 flex-wrap justify-end">
            <label className="flex items-center gap-1.5 text-xs text-shade-50 cursor-pointer">
              <input
                type="checkbox"
                checked={reresearchAll}
                disabled={researchRunning}
                onChange={(e) => setReresearchAll(e.target.checked)}
                className="rounded border-hairline-light"
              />
              Re-research attempted companies too
            </label>
            <label className="flex items-center gap-1.5 text-xs text-shade-50 cursor-pointer">
              <input
                type="checkbox"
                checked={rescanAll}
                disabled={batchRunning}
                onChange={(e) => setRescanAll(e.target.checked)}
                className="rounded border-hairline-light"
              />
              Re-scan already-scanned companies too
            </label>
          </div>
        </div>
      </div>

      {(researchRunning || researchTotal > 0) && (
        <Card className="border-primary/30">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink flex items-center gap-2">
                <Globe className={`w-4 h-4 text-primary ${researchRunning ? "animate-pulse" : ""}`} />
                {researchRunning
                  ? researchFetchingTargets
                    ? "Finding companies to research..."
                    : `Researching companies via AI web search... (${researchDone}/${researchTotal})`
                  : researchStoppedReason
                  ? `Stopped — ${researchDone}/${researchTotal} checked. AI usage cap reached.`
                  : researchDone < researchTotal
                  ? `Stopped — ${researchDone}/${researchTotal} checked. Click "Research Companies" again to resume.`
                  : `Research complete — ${researchDone}/${researchTotal} companies checked`}
              </span>
              {researchRunning ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                  onClick={() => {
                    researchCancelRef.current = true;
                  }}
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              ) : (
                <button
                  type="button"
                  className="text-xs text-shade-50 hover:text-ink"
                  onClick={() => setResearchTotal(0)}
                >
                  Dismiss
                </button>
              )}
            </div>
            <div className="w-full h-1.5 rounded-pill bg-hairline-light overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${researchTotal ? (researchDone / researchTotal) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-shade-50">
              {researchFoundCount} website{researchFoundCount === 1 ? "" : "s"} found
              {researchErrors > 0 && ` · ${researchErrors} lookup${researchErrors === 1 ? "" : "s"} failed`}
            </p>
            {researchStoppedReason && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{researchStoppedReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {(batchRunning || batchTotal > 0) && (
        <Card className="border-primary/30">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink flex items-center gap-2">
                <Radar className={`w-4 h-4 text-primary ${batchRunning ? "animate-pulse" : ""}`} />
                {batchRunning
                  ? batchFetchingTargets
                    ? "Finding companies to scan..."
                    : `Scanning companies for open roles... (${batchDone}/${batchTotal})`
                  : batchDone < batchTotal
                  ? `Stopped — ${batchDone}/${batchTotal} checked. Click "Discover Jobs for All" again to resume.`
                  : `Scan complete — ${batchDone}/${batchTotal} companies checked`}
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
                <button
                  type="button"
                  className="text-xs text-shade-50 hover:text-ink"
                  onClick={() => setBatchTotal(0)}
                >
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
              {batchJobsFound} job{batchJobsFound === 1 ? "" : "s"} found so far
              {batchErrors > 0 && ` · ${batchErrors} company scan${batchErrors === 1 ? "" : "s"} failed`}
              {!batchRunning && batchJobsFound > 0 && (
                <>
                  {" — "}
                  <Link href="/jobs" className="text-primary underline underline-offset-4">
                    review open roles →
                  </Link>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Companies ({total.toLocaleString()})
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-shade-40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full min-h-[40px] pl-9 pr-3 rounded-md border border-hairline-light bg-canvas-light text-sm text-ink placeholder:text-shade-40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="min-h-[40px] rounded-md border border-hairline-light bg-canvas-light px-3 text-sm text-ink capitalize focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <select
              value={websiteFilter}
              onChange={(e) => {
                setWebsiteFilter(e.target.value as "" | "yes" | "no");
                setPage(0);
              }}
              className="min-h-[40px] rounded-md border border-hairline-light bg-canvas-light px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Website: any</option>
              <option value="yes">Has website</option>
              <option value="no">No website</option>
            </select>
            <label
              className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-md border border-hairline-light bg-canvas-light text-sm text-ink cursor-pointer"
              title="Matches company names containing tech-adjacent words (software, digital, design, studio, SaaS, etc.) — a free, imperfect first pass to avoid spending AI research/discovery credit on companies that clearly aren't tech."
            >
              <input
                type="checkbox"
                checked={likelyTechFilter}
                onChange={(e) => {
                  setLikelyTechFilter(e.target.checked);
                  setPage(0);
                }}
                className="rounded border-hairline-light"
              />
              Likely tech only
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-shade-50 py-8 text-center">Loading...</p>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-shade-50">
                {search || statusFilter ? "No companies match your filters." : "No companies yet."}
              </p>
              {!search && !statusFilter && (
                <Link href="/companies/import">
                  <Button variant="primary" size="sm">Import your first CSV</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline-light text-xs font-semibold text-shade-40 uppercase">
                  <tr>
                    <th className="pb-3">
                      <button className="flex items-center gap-1 hover:text-ink" onClick={() => toggleSort("company_name")}>
                        Company <SortIcon column="company_name" />
                      </button>
                    </th>
                    <th className="pb-3">
                      <button className="flex items-center gap-1 hover:text-ink" onClick={() => toggleSort("industry")}>
                        Industry <SortIcon column="industry" />
                      </button>
                    </th>
                    <th className="pb-3">Personalization Hook</th>
                    <th className="pb-3">
                      <button className="flex items-center gap-1 hover:text-ink" onClick={() => toggleSort("status")}>
                        Status <SortIcon column="status" />
                      </button>
                    </th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-light text-ink">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-canvas-cream/50 transition-colors">
                      <td className="py-3.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          {c.company_name}
                          {c.website && (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-shade-40 hover:text-ink"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {c.jobs_scanned_at && !scanResult[c.id] && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        {scanResult[c.id] ? (
                          <p className="text-[11px] text-shade-40 mt-0.5">{scanResult[c.id]}</p>
                        ) : c.jobs_scanned_at ? (
                          <p className="text-[11px] text-shade-40 mt-0.5">
                            Scanned {new Date(c.jobs_scanned_at).toLocaleDateString()}
                          </p>
                        ) : null}
                        {researchRowResult[c.id] ? (
                          <p className="text-[11px] text-shade-40 mt-0.5">{researchRowResult[c.id]}</p>
                        ) : (
                          !c.website &&
                          c.researched_at && (
                            <p className="text-[11px] text-shade-40 mt-0.5">
                              Researched {new Date(c.researched_at).toLocaleDateString()} — no website found
                            </p>
                          )
                        )}
                      </td>
                      <td className="py-3.5 text-shade-60">{c.industry ?? "—"}</td>
                      <td className="py-3.5 text-shade-50 text-xs">{c.personalization_hook ?? "—"}</td>
                      <td className="py-3.5 text-xs capitalize">{c.status}</td>
                      <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                        {!c.website && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            disabled={researchingRow === c.id}
                            onClick={() => handleResearchRow(c.id)}
                          >
                            {researchingRow === c.id ? "Researching..." : "Research"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          disabled={scanning === c.id}
                          onClick={() => handleFindRoles(c.id)}
                        >
                          {scanning === c.id ? "Scanning..." : "Find Roles"}
                        </Button>
                        <Link href={`/emails?company_id=${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Draft Email
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-4 text-xs text-shade-50">
                <span>
                  Page {page + 1} of {totalPages.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="gap-1"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="gap-1"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
