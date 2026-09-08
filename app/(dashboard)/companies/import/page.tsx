"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import { parseCSV, normalizeCompanyName, type ParsedCompany } from "@/lib/csv-parser";

type DuplicateStrategy = "skip" | "replace" | "merge";

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
  const [result, setResult] = useState<{ total: number; imported: number; duplicates: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(f: File) {
    setError(null);
    setResult(null);
    setFile(f);

    const text = await f.text();
    const { companies } = parseCSV(text);
    setPreview(companies);

    const existing = await fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => new Set<string>((data.companies ?? []).map((c: { company_name: string }) => normalizeCompanyName(c.company_name))))
      .catch(() => new Set<string>());
    setExistingNames(existing);
  }

  async function handleImport() {
    if (!file) return;
    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duplicate_strategy", strategy);
      if (campaignTag) formData.append("campaign_tag", campaignTag);

      const res = await fetch("/api/companies/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setResult({ total: data.total, imported: data.imported, duplicates: data.duplicates });
      setTimeout(() => router.push("/companies"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }

  const duplicateCount = preview.filter((c) => existingNames.has(c.normalized_name)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Import Companies</h1>
        <p className="text-sm text-shade-50">Upload a CSV of companies. Columns are auto-detected.</p>
      </div>

      {!file && (
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
          className={`border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-colors ${
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
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {result && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          Imported {result.imported} of {result.total} companies ({result.duplicates} duplicates handled).
          Redirecting...
        </div>
      )}

      {file && preview.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              ✓ {preview.length} companies found
              {duplicateCount > 0 && (
                <span className="text-amber-600 font-normal ml-2">⚠ {duplicateCount} already in your system</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  {preview.map((c, i) => (
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
              <Button variant="primary" onClick={handleImport} disabled={isImporting}>
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
