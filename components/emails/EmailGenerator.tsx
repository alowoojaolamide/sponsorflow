"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

type Company = { id: string; company_name: string; industry: string | null };

export type GenerateParams = {
  companyId: string;
  jobTitle?: string;
  jobUrl?: string;
  jobDescription?: string;
};

export function EmailGenerator({
  onGenerate,
  isGenerating,
  initialCompanyId,
  initialJobTitle,
  initialJobUrl,
}: {
  onGenerate: (params: GenerateParams) => void;
  isGenerating: boolean;
  initialCompanyId?: string;
  initialJobTitle?: string;
  initialJobUrl?: string;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [selected, setSelected] = useState(initialCompanyId ?? "");
  const [showJobFields, setShowJobFields] = useState(!!initialJobTitle);
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [jobUrl, setJobUrl] = useState(initialJobUrl ?? "");
  const [jobDescription, setJobDescription] = useState("");

  useEffect(() => {
    fetch("/api/companies?limit=2000")
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.companies ?? []);
        setTotalCompanies(data.total ?? 0);
      });
  }, []);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Email Personalization Engine
        </CardTitle>
        <p className="text-sm text-shade-50">
          Select a target company to generate a personalized email matching your verified background.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Target Company</label>
          <select
            className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">
              {companies.length === 0 ? "No companies yet — import some first" : "Choose a company..."}
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} {c.industry ? `(${c.industry})` : ""}
              </option>
            ))}
          </select>
          {totalCompanies > companies.length && (
            <p className="text-[11px] text-shade-40 mt-1">
              Showing the {companies.length.toLocaleString()} most recent of {totalCompanies.toLocaleString()} companies. Use &quot;Draft Email&quot; from the Companies list to target an older one.
            </p>
          )}
        </div>

        <button
          type="button"
          className="text-xs text-primary underline underline-offset-4"
          onClick={() => setShowJobFields((s) => !s)}
        >
          {showJobFields ? "Hide" : "Pitching for a specific open role?"}
        </button>

        {showJobFields && (
          <div className="space-y-3 p-3 bg-canvas-cream rounded-md border border-hairline-light">
            <Input
              label="Job title"
              placeholder="Senior Product Designer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <Input
              label="Job posting URL (optional)"
              placeholder="https://company.com/careers/123"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Job description (optional — paste it for a sharper pitch)</label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="flex w-full rounded-md border border-hairline-light bg-canvas-light px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t border-hairline-light pt-4">
        <span className="text-xs text-shade-40">Powered by Anthropic Claude API</span>
        <Button
          variant="primary"
          disabled={isGenerating || !selected}
          onClick={() =>
            onGenerate({
              companyId: selected,
              jobTitle: jobTitle || undefined,
              jobUrl: jobUrl || undefined,
              jobDescription: jobDescription || undefined,
            })
          }
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating Draft...
            </span>
          ) : (
            "Generate Personalized Draft"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
