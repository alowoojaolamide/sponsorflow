"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Check, Edit3, X, RotateCcw } from "lucide-react";

export interface DraftEmailPreview {
  id: string;
  companyName: string;
  contactName: string;
  industry: string;
  subject: string;
  body: string;
  wordCount: number;
}

export function EmailApprovalUI({ draft }: { draft?: DraftEmailPreview }) {
  const sampleDraft: DraftEmailPreview = draft || {
    id: "sample-1",
    companyName: "ClearBank",
    contactName: "Jane Smith (Head of Design)",
    industry: "Fintech",
    subject: "Embedded banking workflows & design clarity at ClearBank",
    body: "Hi Jane,\n\nI’ve been following ClearBank’s momentum in cloud-native banking infrastructure. In my recent roles, I led product design initiatives reducing workflow friction by 40% in high-complexity fintech environments.\n\nI’d love to share my portfolio and see if my background aligns with your design priorities in London.\n\nBest regards,\nDoyin",
    wordCount: 52,
  };

  return (
    <Card className="max-w-3xl border-hairline-light shadow-paper-halo">
      <CardHeader className="border-b border-hairline-light pb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-aloe-10 text-ink">
              {sampleDraft.industry} Positioning
            </span>
            <CardTitle className="text-lg font-bold mt-2">
              Review Draft: {sampleDraft.companyName}
            </CardTitle>
            <p className="text-xs text-shade-50 mt-0.5">Recipient: {sampleDraft.contactName}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-shade-50">Word Count: {sampleDraft.wordCount} words</span>
            <p className="text-[11px] text-emerald-600 font-medium">Within 70–150 word guideline</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 font-mono text-sm">
        <div className="p-3 bg-canvas-cream rounded-md border border-hairline-light">
          <span className="text-xs font-bold text-shade-50 uppercase tracking-wider block mb-1">
            Subject
          </span>
          <p className="text-ink font-sans font-medium">{sampleDraft.subject}</p>
        </div>

        <div className="p-4 bg-canvas-cream rounded-md border border-hairline-light whitespace-pre-wrap font-sans text-ink leading-relaxed">
          {sampleDraft.body}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline-light pt-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Regenerate
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-red-600 hover:text-red-700">
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>

        <Button variant="primary" size="md" className="gap-2">
          <Check className="w-4 h-4" /> Approve & Queue to Send
        </Button>
      </CardFooter>
    </Card>
  );
}
