"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import { parseCSV, normalizeCompanyName, type ParsedCompany } from "@/lib/csv-parser";
import { ImportProgressPanel } from "@/components/companies/ImportProgressPanel";

type DuplicateStrategy = "skip" | "replace" | "merge";

const BATCH_SIZE = 1000;
const CONCURRENCY = 3;
const PREVIEW_LIMIT = 200;

export default function CompanyImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedCompany[]>([]);
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());
  const [campaignTag, setCampaignTag] = useState("");
  const [strategy, setStrategy] = useState<DuplicateStrategy>("skip");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, imported: 0, duplicates: 0, recentNames: [] as string[] });
  const [result, setResult] = useState<{ total: number; imported: number; duplicates: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setError(null);
    setResult(null);

    const text = await f.text();
    const { companies } = parseCSV(text);

    if (companies.length === 0) {
      setError(
        "Couldn't find any company rows in that file. Make sure it's a CSV with a header row and at least one column of company names."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(f);
    setPreview(companies);

    const existing = await fetch("/api/companies?limit=2000")
      .then((res) => res.json())
      .then((data) => new Set<string>((data.companies ?? []).map((c: { company_name: string }) => normalizeCompanyName(c.company_name))))
      .catch(() => new Set<string>());
    setExistingNames(existing);
  }

  async function handleImport() {
    if (!file || preview.length === 0) return;
    setIsImporting(true);
    setError(null);
    setProgress({ processed: 0, imported: 0, duplicates: 0, recentNames: [] });

    try {
      const startRes = await fetch("/api/companies/import/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: file.name, file_size: file.size, total_companies: preview.length }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error || "Failed to start import");
      const importId = startData.import_id;

      const chunks: ParsedCompany[][] = [];
      for (let i = 0; i < preview.length; i += BATCH_SIZE) {
        chunks.push(preview.slice(i, i + BATCH_SIZE));
      }

      const totals = { processed: 0, imported: 0, duplicates: 0 };
      let recentNames: string[] = [];
      let firstError: string | null = null;

      let nextIndex = 0;
      const worker = async () => {
        while (nextIndex < chunks.length) {
          const i = nextIndex++;
          const chunk = chunks[i];

          try {
            const res = await fetch("/api/companies/import/batch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                import_id: importId,
                companies: chunk,
                campaign_tag: campaignTag || null,
                duplicate_strategy: strategy,
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Batch failed");

            totals.processed += chunk.length;
            totals.imported += data.imported;
            totals.duplicates += data.duplicates;
            recentNames = [...chunk.slice(-5).map((c) => c.company_name).reverse(), ...recentNames].slice(0, 6);

            setProgress({ ...totals, recentNames });
          } catch (err: unknown) {
            firstError = firstError ?? (err instanceof Error ? err.message : "Batch failed");
            totals.processed += chunk.length;
            setProgress({ ...totals, recentNames });
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));

      await fetch("/api/companies/import/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          import_id: importId,
          companies_imported: totals.imported,
          companies_duplicates: totals.duplicates,
        }),
      });

      if (firstError) {
        setError(`Some batches failed (${firstError}). ${totals.imported} companies were still imported successfully.`);
      }

      setResult({ total: preview.length, imported: totals.imported, duplicates: totals.duplicates });
      setTimeout(() => router.push("/companies"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  const duplicateCount = preview.filter((c) => existingNames.has(c.normalized_name)).length;
  const visiblePreview = preview.slice(0, PREVIEW_LIMIT);

  return (
    <div className={`space-y-6 ${isImporting || result ? "" : "max-w-4xl"}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Import Companies</h1>
        <p className="text-sm text-shade-50">Upload a CSV of companies. Columns are auto-detected.</p>
      </div>

      {!file && !isImporting && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors max-w-4xl ${
            isDragging ? "border-primary bg-aloe-10/20" : "border-hairline-light bg-canvas-light"
          }`}
        >
          <UploadCloud className="w-10 h-10 mx-auto text-shade-40 mb-3" />
          <p className="text-sm font-medium text-ink">Drag & drop your CSV file here</p>
          <p className="text-xs text-shade-50 mt-1">or click to browse (.csv)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 max-w-4xl">{error}</div>
      )}

      {result && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 max-w-4xl">
          Imported {result.imported.toLocaleString()} of {result.total.toLocaleString()} companies (
          {result.duplicates.toLocaleString()} duplicates handled). Redirecting...
        </div>
      )}

      {file && preview.length > 0 && !result && (
        <div className={isImporting ? "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start" : "max-w-4xl"}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                ✓ {preview.length.toLocaleString()} companies found
                {duplicateCount > 0 && !isImporting && (
                  <span className="text-amber-600 font-normal ml-2">⚠ {duplicateCount.toLocaleString()} already in your system</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isImporting && (
                <>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto border border-hairline-light rounded-md">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-hairline-light text-xs font-semibold text-shade-40 uppercase sticky top-0 bg-canvas-light">
                        <tr>
                          <th className="p-2">Company</th>
                          <th className="p-2">Website</th>
                          <th className="p-2">Industry</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline-light">
                        {visiblePreview.map((c, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{c.company_name}</td>
                            <td className="p-2 text-shade-50">{c.website ?? "—"}</td>
                            <td className="p-2 text-shade-50">{c.industry ?? "—"}</td>
                            <td className="p-2">
                              {existingNames.has(c.normalized_name) ? (
                                <span className="text-amber-600 text-xs">⚠ Duplicate</span>
                              ) : (
                                <span className="text-emerald-600 text-xs">✓ New</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.length > PREVIEW_LIMIT && (
                    <p className="text-xs text-shade-40">
                      Showing the first {PREVIEW_LIMIT} of {preview.length.toLocaleString()} rows.
                    </p>
                  )}

                  {duplicateCount > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">Duplicate handling</label>
                      <div className="flex flex-col gap-1.5">
                        {(["skip", "replace", "merge"] as DuplicateStrategy[]).map((s) => (
                          <label key={s} className="flex items-center gap-2 text-sm capitalize">
                            <input type="radio" checked={strategy === s} onChange={() => setStrategy(s)} />
                            {s === "skip" && "Skip duplicates (import only new)"}
                            {s === "replace" && "Replace existing with updated data"}
                            {s === "merge" && "Merge (update campaign tag, keep existing data)"}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <Input
                    label="Campaign tag (optional)"
                    placeholder="london_shortlist_v2"
                    value={campaignTag}
                    onChange={(e) => setCampaignTag(e.target.value)}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline-light" onClick={() => { setFile(null); setPreview([]); }}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleImport}>
                      Import
                    </Button>
                  </div>
                </>
              )}

              {isImporting && (
                <p className="text-sm text-shade-50">
                  Importing {preview.length.toLocaleString()} companies in batches of {BATCH_SIZE.toLocaleString()}...
                  Keep this tab open.
                </p>
              )}
            </CardContent>
          </Card>

          {isImporting && (
            <ImportProgressPanel
              total={preview.length}
              processed={progress.processed}
              imported={progress.imported}
              duplicates={progress.duplicates}
              recentNames={progress.recentNames}
              done={progress.processed >= preview.length}
            />
          )}
        </div>
      )}
    </div>
  );
}
