"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmailApprovalUI, type EmailDraftView } from "@/components/emails/EmailApprovalUI";

type PendingEmail = {
  id: string;
  company_id: string;
  subject: string;
  body: string;
  to_name: string | null;
  to_email: string;
  status: string;
  ai_positioning_angle: string | null;
};

export default function PendingEmailsPage() {
  const [emails, setEmails] = useState<PendingEmail[]>([]);
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    const [emailsRes, companiesRes] = await Promise.all([
      fetch("/api/emails?status=draft").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
    ]);
    setEmails(emailsRes.emails ?? []);
    setCompanyNames(
      Object.fromEntries(
        (companiesRes.companies ?? []).map((c: { id: string; company_name: string }) => [c.id, c.company_name])
      )
    );
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = emails.find((e) => e.id === selectedId) ?? null;
  const selectedDraft: EmailDraftView | null = selected
    ? {
        id: selected.id,
        company_name: companyNames[selected.company_id] ?? "Unknown company",
        to_name: selected.to_name,
        to_email: selected.to_email,
        ai_positioning_angle: selected.ai_positioning_angle,
        subject: selected.subject,
        body: selected.body,
        status: selected.status,
      }
    : null;

  async function withRefresh(action: () => Promise<Response>) {
    setIsBusy(true);
    try {
      await action();
      await refresh();
      setSelectedId(null);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
          Pending Approval ({emails.length})
        </h1>
        <p className="text-sm text-shade-50">Every draft waits here for your review before it can be sent.</p>
      </div>

      {selectedDraft ? (
        <div className="space-y-3">
          <button className="text-sm text-primary underline underline-offset-4" onClick={() => setSelectedId(null)}>
            ← Back to list
          </button>
          <EmailApprovalUI
            draft={selectedDraft}
            isBusy={isBusy}
            onApprove={() =>
              withRefresh(() =>
                fetch(`/api/emails/${selectedDraft.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "ready_to_send" }),
                })
              )
            }
            onReject={() => withRefresh(() => fetch(`/api/emails/${selectedDraft.id}/reject`, { method: "POST" }))}
            onSaveEdit={(subject, body) =>
              withRefresh(() =>
                fetch(`/api/emails/${selectedDraft.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject, body }),
                })
              )
            }
          />
        </div>
      ) : loading ? (
        <p className="text-sm text-shade-50">Loading...</p>
      ) : emails.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-shade-50">
            No pending drafts. Generate one from the <a href="/emails" className="text-primary underline">Outreach</a> page.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {emails.map((e) => (
            <Card key={e.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink text-sm">
                    {companyNames[e.company_id] ?? "Unknown company"} — {e.to_name ?? e.to_email}
                  </p>
                  <p className="text-xs text-shade-50 mt-0.5">Subject: {e.subject}</p>
                  <p className="text-xs text-shade-40 mt-0.5 capitalize">Status: {e.status}</p>
                </div>
                <button
                  className="text-sm font-medium text-primary underline underline-offset-4"
                  onClick={() => setSelectedId(e.id)}
                >
                  Review
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
