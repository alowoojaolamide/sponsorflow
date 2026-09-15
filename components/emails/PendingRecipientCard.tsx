"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export type PendingDraft = {
  company_id: string;
  company_name: string;
  contact_id: string | null;
  subject: string;
  body: string;
  positioning_angle: string;
  confidence: number;
  job_title: string | null;
  job_url: string | null;
};

export function PendingRecipientCard({
  pending,
  isBusy,
  onSave,
}: {
  pending: PendingDraft;
  isBusy?: boolean;
  onSave: (toEmail: string) => void;
}) {
  const [toEmail, setToEmail] = useState("");

  return (
    <Card className="max-w-3xl border-amber-300 shadow-paper-halo">
      <CardHeader className="border-b border-hairline-light pb-4">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <CardTitle className="text-base font-bold">Recipient email needed</CardTitle>
        </div>
        <p className="text-xs text-shade-50 mt-1">
          {pending.company_name} has no website or contact on file, so a recipient couldn&apos;t be
          guessed automatically. The draft below was generated — add an email to save it.
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Recipient email</label>
          <input
            type="email"
            autoFocus
            placeholder="careers@company.com"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="p-3 bg-canvas-cream rounded-md border border-hairline-light">
          <span className="text-xs font-bold text-shade-50 uppercase tracking-wider block mb-1">Subject</span>
          <p className="text-ink font-sans font-medium text-sm">{pending.subject}</p>
        </div>
        <div className="p-4 bg-canvas-cream rounded-md border border-hairline-light whitespace-pre-wrap font-sans text-ink leading-relaxed text-sm max-h-48 overflow-y-auto">
          {pending.body}
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={isBusy || !toEmail.trim()}
          onClick={() => onSave(toEmail.trim())}
        >
          Save Draft
        </Button>
      </CardContent>
    </Card>
  );
}
