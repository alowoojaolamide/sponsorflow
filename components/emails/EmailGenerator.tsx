"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

type Company = { id: string; company_name: string; industry: string | null };

export function EmailGenerator({
  onGenerate,
  isGenerating,
  initialCompanyId,
}: {
  onGenerate: (companyId: string) => void;
  isGenerating: boolean;
  initialCompanyId?: string;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState(initialCompanyId ?? "");

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies ?? []));
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
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-hairline-light pt-4">
        <span className="text-xs text-shade-40">Powered by Anthropic Claude API</span>
        <Button
          variant="primary"
          disabled={isGenerating || !selected}
          onClick={() => onGenerate(selected)}
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
