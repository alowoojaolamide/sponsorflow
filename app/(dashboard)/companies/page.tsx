"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, Building2, ExternalLink, Search } from "lucide-react";

type Company = {
  id: string;
  company_name: string;
  website: string | null;
  career_page: string | null;
  industry: string | null;
  personalization_hook: string | null;
  status: string;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies ?? []))
      .finally(() => setLoading(false));
  }, []);

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
    } catch (err: unknown) {
      setScanResult((r) => ({ ...r, [companyId]: err instanceof Error ? err.message : "Scan failed" }));
    } finally {
      setScanning(null);
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
        <div className="flex gap-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" /> Companies ({companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-shade-50 py-8 text-center">Loading...</p>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-shade-50">No companies yet.</p>
              <Link href="/companies/import">
                <Button variant="primary" size="sm">Import your first CSV</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-hairline-light text-xs font-semibold text-shade-40 uppercase">
                  <tr>
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Industry</th>
                    <th className="pb-3">Personalization Hook</th>
                    <th className="pb-3">Status</th>
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
                        </div>
                        {scanResult[c.id] && (
                          <p className="text-[11px] text-shade-40 mt-0.5">{scanResult[c.id]}</p>
                        )}
                      </td>
                      <td className="py-3.5 text-shade-60">{c.industry ?? "—"}</td>
                      <td className="py-3.5 text-shade-50 text-xs">{c.personalization_hook ?? "—"}</td>
                      <td className="py-3.5 text-xs capitalize">{c.status}</td>
                      <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
