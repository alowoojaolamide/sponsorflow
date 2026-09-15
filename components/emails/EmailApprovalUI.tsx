"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Check, Edit3, X, RotateCcw } from "lucide-react";

export type EmailDraftView = {
  id: string;
  company_name: string;
  to_name: string | null;
  to_email: string;
  ai_positioning_angle: string | null;
  subject: string;
  body: string;
  status: string;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function EmailApprovalUI({
  draft,
  onApprove,
  onReject,
  onRegenerate,
  onSaveEdit,
  isBusy,
}: {
  draft: EmailDraftView | null;
  onApprove?: () => void;
  onReject?: () => void;
  onRegenerate?: () => void;
  onSaveEdit?: (subject: string, body: string, toEmail: string) => void;
  isBusy?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [toEmail, setToEmail] = useState(draft?.to_email ?? "");

  useEffect(() => {
    setSubject(draft?.subject ?? "");
    setBody(draft?.body ?? "");
    setToEmail(draft?.to_email ?? "");
    setEditing(false);
  }, [draft?.id, draft?.subject, draft?.body, draft?.to_email]);

  if (!draft) {
    return (
      <Card className="max-w-3xl border-hairline-light shadow-paper-halo">
        <CardContent className="py-16 text-center text-sm text-shade-50">
          No draft yet — generate one from a company on the left.
        </CardContent>
      </Card>
    );
  }

  const count = wordCount(editing ? body : draft.body);

  return (
    <Card className="max-w-3xl border-hairline-light shadow-paper-halo">
      <CardHeader className="border-b border-hairline-light pb-4">
        <div className="flex items-center justify-between">
          <div>
            {draft.ai_positioning_angle && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-aloe-10 text-on-aloe">
                {draft.ai_positioning_angle} Positioning
              </span>
            )}
            <CardTitle className="text-lg font-bold mt-2">
              Review Draft: {draft.company_name}
            </CardTitle>
            {editing ? (
              <div className="mt-1.5">
                <input
                  type="email"
                  placeholder="recipient@company.com"
                  className="text-xs font-mono px-2 py-1 rounded border border-hairline-light bg-canvas-cream text-ink w-64 focus:border-primary focus:outline-none"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                />
              </div>
            ) : (
              <p className="text-xs text-shade-50 mt-0.5">
                Recipient: {draft.to_email || <span className="text-amber-600 font-medium">Not set — click Edit to add one</span>}
                {draft.to_name ? ` (${draft.to_name})` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-shade-50">Word Count: {count} words</span>
            <p className={`text-[11px] font-medium ${count >= 70 && count <= 150 ? "text-emerald-600" : "text-amber-600"}`}>
              {count >= 70 && count <= 150 ? "Within 70–150 word guideline" : "Outside 70–150 word guideline"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3 font-mono text-sm">
        {editing ? (
          <>
            <input
              className="w-full p-3 bg-canvas-cream rounded-md border border-hairline-light font-sans font-medium"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="w-full p-4 bg-canvas-cream rounded-md border border-hairline-light font-sans"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        ) : (
          <>
            <div className="p-3 bg-canvas-cream rounded-md border border-hairline-light">
              <span className="text-xs font-bold text-shade-50 uppercase tracking-wider block mb-1">
                Subject
              </span>
              <p className="text-ink font-sans font-medium">{draft.subject}</p>
            </div>
            <div className="p-4 bg-canvas-cream rounded-md border border-hairline-light whitespace-pre-wrap font-sans text-ink leading-relaxed">
              {draft.body}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline-light pt-4">
        <div className="flex gap-2">
          {editing ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              disabled={!toEmail.trim()}
              onClick={() => {
                onSaveEdit?.(subject, body, toEmail.trim());
                setEditing(false);
              }}
            >
              <Check className="w-3.5 h-3.5" /> Save Edit
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" disabled={isBusy} onClick={onRegenerate}>
            <RotateCcw className="w-3.5 h-3.5" /> Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-red-600 hover:text-red-700"
            disabled={isBusy}
            onClick={onReject}
          >
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>

        <Button
          variant="primary"
          size="md"
          className="gap-2"
          disabled={isBusy || !draft.to_email}
          title={!draft.to_email ? "Add a recipient email first (click Edit)" : undefined}
          onClick={onApprove}
        >
          <Check className="w-4 h-4" /> Approve & Queue to Send
        </Button>
      </CardFooter>
    </Card>
  );
}
