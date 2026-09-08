"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";

export function EmailGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Email Personalization Engine
        </CardTitle>
        <p className="text-sm text-shade-50">
          Select a target company from your UK sponsor shortlist to generate a personalized email matching your verified background.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Target Company</label>
          <select className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Choose a sponsor (e.g., ClearBank, Monzo, Canva)...</option>
            <option value="clearbank">ClearBank (Fintech / London)</option>
            <option value="canva">Canva (Design Platform / London)</option>
            <option value="airbnb">Airbnb (Marketplace / London)</option>
          </select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-hairline-light pt-4">
        <span className="text-xs text-shade-40">Powered by Anthropic Claude API</span>
        <Button
          variant="primary"
          disabled={isGenerating}
          onClick={() => {
            setIsGenerating(true);
            setTimeout(() => setIsGenerating(false), 1500);
          }}
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
