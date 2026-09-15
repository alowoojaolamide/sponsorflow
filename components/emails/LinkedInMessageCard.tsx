"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Copy, Check } from "lucide-react";

export type LinkedInDraftView = {
  company_name: string;
  connection_note: string;
  message: string;
  positioning_angle: string;
};

function CopyableBlock({ label, text, limit }: { label: string; text: string; limit?: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const overLimit = limit != null && text.length > limit;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-shade-40 uppercase">{label}</label>
        <div className="flex items-center gap-2">
          {limit != null && (
            <span className={`text-[11px] ${overLimit ? "text-red-500" : "text-shade-40"}`}>
              {text.length}/{limit}
            </span>
          )}
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <p className="text-sm text-ink whitespace-pre-wrap p-3 rounded-md border border-hairline-light bg-canvas-cream">
        {text}
      </p>
    </div>
  );
}

export function LinkedInMessageCard({ draft }: { draft: LinkedInDraftView | null }) {
  if (!draft) {
    return (
      <Card className="max-w-3xl border-hairline-light shadow-paper-halo">
        <CardContent className="py-16 text-center text-sm text-shade-50">
          Generate a LinkedIn message from the panel on the left to preview it here — copy-paste only,
          nothing is ever sent automatically.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl border-hairline-light shadow-paper-halo">
      <CardHeader className="border-b border-hairline-light pb-4">
        <div className="flex items-center gap-2">
          <Linkedin className="w-4 h-4 text-primary" />
          <CardTitle className="text-lg font-bold">LinkedIn Message: {draft.company_name}</CardTitle>
        </div>
        <p className="text-xs text-shade-50 mt-0.5">
          Positioning angle: <span className="capitalize">{draft.positioning_angle}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <CopyableBlock label="Connection Request Note" text={draft.connection_note} limit={300} />
        <CopyableBlock label="Follow-up Message" text={draft.message} />
        <p className="text-[11px] text-shade-40">
          Paste the note when sending a connection request, then send the longer message once connected
          (or directly, if you can already message this person).
        </p>
      </CardContent>
    </Card>
  );
}
